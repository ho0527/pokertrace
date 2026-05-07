--
-- PostgreSQL database dump
--

-- Dumped from database version 13.2
-- Dumped by pg_dump version 17.0

-- Started on 2025-09-09 21:01:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: chris0527
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO chris0527;

--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: chris0527
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 273 (class 1255 OID 18479)
-- Name: calculate_bb_per_100(bigint, date, date); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.calculate_bb_per_100(player_id bigint, start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
declare
    total_hands int;
    total_winnings bigint;
    avg_big_blind numeric;
    bb_100 numeric;
begin
    -- 計算總手數和總贏損
    select 
        count(distinct hp.handid),
        coalesce(sum(vhpr.netamount), 0),
        avg(h.bigblind)
    into total_hands, total_winnings, avg_big_blind
    from handplayer hp
    join hand h on h.id = hp.handid
    join v_hand_player_result vhpr on vhpr.handid = hp.handid and vhpr.playerid = hp.playerid
    where hp.playerid = player_id
    and (start_date is null or h.handstarttime::date >= start_date)
    and (end_date is null or h.handstarttime::date <= end_date)
    and h.deletetime is null;
    
    if total_hands = 0 or avg_big_blind = 0 then
        return 0;
    end if;
    
    bb_100 = (total_winnings::numeric / avg_big_blind) / (total_hands::numeric / 100);
    
    return round(bb_100, 2);
end;
$$;


ALTER FUNCTION public.calculate_bb_per_100(player_id bigint, start_date date, end_date date) OWNER TO chris0527;

--
-- TOC entry 272 (class 1255 OID 18478)
-- Name: calculate_player_pfr(bigint, date, date); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.calculate_player_pfr(player_id bigint, start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
declare
    total_hands int;
    pfr_hands int;
begin
    -- 計算總手數
    select count(distinct hp.handid) into total_hands
    from handplayer hp
    join hand h on h.id = hp.handid
    where hp.playerid = player_id
    and (start_date is null or h.handstarttime::date >= start_date)
    and (end_date is null or h.handstarttime::date <= end_date)
    and h.deletetime is null;
    
    -- 計算PFR手數
    select count(distinct hp.handid) into pfr_hands
    from handplayer hp
    join hand h on h.id = hp.handid
    join handaction ha on ha.handid = hp.handid and ha.playerid = hp.playerid
    where hp.playerid = player_id
    and ha.street = 'preflop'
    and ha.action = 'raise'
    and (start_date is null or h.handstarttime::date >= start_date)
    and (end_date is null or h.handstarttime::date <= end_date)
    and h.deletetime is null;
    
    if total_hands = 0 then
        return 0;
    end if;
    
    return round((pfr_hands::numeric / total_hands::numeric) * 100, 2);
end;
$$;


ALTER FUNCTION public.calculate_player_pfr(player_id bigint, start_date date, end_date date) OWNER TO chris0527;

--
-- TOC entry 271 (class 1255 OID 18477)
-- Name: calculate_player_vpip(bigint, date, date); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.calculate_player_vpip(player_id bigint, start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
declare
    total_hands int;
    vpip_hands int;
begin
    -- 計算總手數
    select count(distinct hp.handid) into total_hands
    from handplayer hp
    join hand h on h.id = hp.handid
    where hp.playerid = player_id
    and (start_date is null or h.handstarttime::date >= start_date)
    and (end_date is null or h.handstarttime::date <= end_date)
    and h.deletetime is null;
    
    -- 計算VPIP手數
    select count(distinct hp.handid) into vpip_hands
    from handplayer hp
    join hand h on h.id = hp.handid
    join handaction ha on ha.handid = hp.handid and ha.playerid = hp.playerid
    where hp.playerid = player_id
    and ha.street = 'preflop'
    and ha.action in ('call', 'bet', 'raise', 'post_straddle')
    and ha.topot = true
    and (start_date is null or h.handstarttime::date >= start_date)
    and (end_date is null or h.handstarttime::date <= end_date)
    and h.deletetime is null;
    
    if total_hands = 0 then
        return 0;
    end if;
    
    return round((vpip_hands::numeric / total_hands::numeric) * 100, 2);
end;
$$;


ALTER FUNCTION public.calculate_player_vpip(player_id bigint, start_date date, end_date date) OWNER TO chris0527;

--
-- TOC entry 268 (class 1255 OID 18474)
-- Name: check_hand_action_sequence(); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.check_hand_action_sequence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    -- 檢查seq是否連續
    if exists (
        select 1 from handaction 
        where handid = new.handid 
        and seq >= new.seq 
        and id != coalesce(new.id, 0)
    ) then
        raise exception 'Action sequence number % already exists for hand %', new.seq, new.handid;
    end if;
    
    -- 檢查street不能倒退
    if exists (
        select 1 from handaction ha
        where ha.handid = new.handid
        and ha.seq < new.seq
        and case ha.street
            when 'preflop' then 1
            when 'flop' then 2
            when 'turn' then 3
            when 'river' then 4
            when 'showdown' then 5
        end >
        case new.street
            when 'preflop' then 1
            when 'flop' then 2
            when 'turn' then 3
            when 'river' then 4
            when 'showdown' then 5
        end
    ) then
        raise exception 'Street cannot go backward: previous action was after current street';
    end if;
    
    return new;
end;
$$;


ALTER FUNCTION public.check_hand_action_sequence() OWNER TO chris0527;

--
-- TOC entry 269 (class 1255 OID 18476)
-- Name: check_pot_balance(bigint); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.check_pot_balance(hand_id bigint) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
declare
    total_invested bigint;
    total_returned bigint;
    total_allocated bigint;
    total_rake bigint;
begin
    -- 計算總投入
    select coalesce(sum(amount), 0) into total_invested
    from handaction
    where handid = hand_id and topot = true;
    
    -- 計算總退回
    select coalesce(sum(amount), 0) into total_returned
    from handaction
    where handid = hand_id and action = 'return_uncalled';
    
    -- 計算總分配
    select coalesce(sum(hpa.amount), 0) into total_allocated
    from handpotallocation hpa
    join handpot hp on hp.id = hpa.handpotid
    where hp.handid = hand_id;
    
    -- 計算總抽水
    select coalesce(sum(rakeamount + feeamount), 0) into total_rake
    from handrake
    where handid = hand_id;
    
    -- 檢查守恆：投入 - 退回 = 分配 + 抽水
    return (total_invested - total_returned) = (total_allocated + total_rake);
end;
$$;


ALTER FUNCTION public.check_pot_balance(hand_id bigint) OWNER TO chris0527;

--
-- TOC entry 270 (class 1255 OID 18482)
-- Name: cleanup_soft_deleted_records(integer); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.cleanup_soft_deleted_records(days_old integer DEFAULT 90) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
    deleted_count int := 0;
    row_deleted int;
    table_rec record;
begin
    for table_rec in
        select schemaname, tablename
        from pg_tables
        where schemaname = 'public'
        and exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
            and table_name = pg_tables.tablename
            and column_name = 'deletetime'
        )
    loop
        execute format('delete from %I.%I where deletetime < now() - interval ''%s days''',
                      table_rec.schemaname, table_rec.tablename, days_old)
        into row_deleted;
        deleted_count := deleted_count + row_deleted;
    end loop;
    
    return deleted_count;
end;
$$;


ALTER FUNCTION public.cleanup_soft_deleted_records(days_old integer) OWNER TO chris0527;

--
-- TOC entry 255 (class 1255 OID 18491)
-- Name: create_hand_monthly_partition(integer, integer); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.create_hand_monthly_partition(year integer, month integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
    table_name text;
    start_date text;
    end_date text;
begin
    table_name := 'hand_' || year || '_' || lpad(month::text, 2, '0');
    start_date := year || '-' || lpad(month::text, 2, '0') || '-01';
    end_date := (date(start_date) + interval '1 month')::text;
    
    execute format('
        create table if not exists %I (
            like hand including all,
            constraint %I_handstarttime_check 
            check (handstarttime >= date %L and handstarttime < date %L)
        ) inherits (hand)',
        table_name, table_name, start_date, end_date
    );
    
    execute format('create index if not exists %I_handstarttime_idx on %I (handstarttime)',
                   table_name, table_name);
end;
$$;


ALTER FUNCTION public.create_hand_monthly_partition(year integer, month integer) OWNER TO chris0527;

--
-- TOC entry 275 (class 1255 OID 18481)
-- Name: get_hand_replay_data(bigint); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.get_hand_replay_data(hand_id bigint) RETURNS json
    LANGUAGE plpgsql
    AS $$
declare
    result json;
begin
    select json_build_object(
        'hand_info', (
            select json_build_object(
                'handid', h.id,
                'handno', h.handno,
                'starttime', h.handstarttime,
                'endtime', h.handendtime,
                'dealerseat', h.dealerseat,
                'smallblind', h.smallblind,
                'bigblind', h.bigblind,
                'ante', h.ante,
                'totalpot', h.totalpot,
                'rake', h.rake,
                'state', h.state
            )
            from hand h
            where h.id = hand_id
        ),
        'players', (
            select json_agg(
                json_build_object(
                    'playerid', hp.playerid,
                    'nickname', p.nickname,
                    'seatno', hp.seatno,
                    'position', hp.position,
                    'stackstart', hp.stackstart,
                    'stackend', hp.stackend,
                    'holecards', hp.holecards,
                    'finalhand', hp.finalhand,
                    'handstrength', hp.handstrength,
                    'iswinner', hp.iswinner,
                    'amountwon', hp.amountwon,
                    'netresult', hp.netresult
                ) order by hp.seatno
            )
            from handplayer hp
            join player p on p.id = hp.playerid
            where hp.handid = hand_id
        ),
        'actions', (
            select json_agg(
                json_build_object(
                    'seq', ha.seq,
                    'actiontime', ha.actiontime,
                    'playerid', ha.playerid,
                    'playername', p.nickname,
                    'street', ha.street,
                    'action', ha.action,
                    'amount', ha.amount,
                    'topot', ha.topot,
                    'potsizebefore', ha.potsizebefore,
                    'potsizeafter', ha.potsizeafter,
                    'facingbet', ha.facingbet,
                    'timetaken', ha.timetaken,
                    'isaggressive', ha.isaggressive,
                    'runno', ha.runno
                ) order by ha.seq
            )
            from handaction ha
            left join player p on p.id = ha.playerid
            where ha.handid = hand_id
        ),
        'community_cards', (
            select json_agg(
                json_build_object(
                    'runno', cc.runno,
                    'street', cc.street,
                    'cards', cc.cards
                ) order by cc.runno, cc.street
            )
            from communitycard cc
            where cc.handid = hand_id
        ),
        'pots', (
            select json_agg(
                json_build_object(
                    'runno', hp.runno,
                    'potno', hp.potno,
                    'amount', hp.amount,
                    'ismain', hp.ismain,
                    'allocations', (
                        select json_agg(
                            json_build_object(
                                'winnerplayerid', hpa.winnerplayerid,
                                'winnername', p.nickname,
                                'amount', hpa.amount
                            )
                        )
                        from handpotallocation hpa
                        join player p on p.id = hpa.winnerplayerid
                        where hpa.handpotid = hp.id
                    )
                ) order by hp.runno, hp.potno
            )
            from handpot hp
            where hp.handid = hand_id
        )
    ) into result;
    
    return result;
end;
$$;


ALTER FUNCTION public.get_hand_replay_data(hand_id bigint) OWNER TO chris0527;

--
-- TOC entry 274 (class 1255 OID 18480)
-- Name: update_player_daily_stats(date); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.update_player_daily_stats(target_date date DEFAULT CURRENT_DATE) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
    player_rec record;
begin
    for player_rec in 
        select distinct p.id as playerid
        from player p
        join handplayer hp on hp.playerid = p.id
        join hand h on h.id = hp.handid
        where h.handstarttime::date = target_date
        and h.deletetime is null
    loop
        insert into playerstatdaily (
            playerid, day, handsplayed, vpip, pfr, winning, bbper100
        )
        select
            player_rec.playerid,
            target_date,
            count(distinct hp.handid),
            count(distinct case when vhpf.vpip then hp.handid end),
            count(distinct case when vhpf.pfr then hp.handid end),
            coalesce(sum(vhpr.netamount), 0),
            calculate_bb_per_100(player_rec.playerid, target_date, target_date)
        from handplayer hp
        join hand h on h.id = hp.handid
        left join v_hand_player_preflop vhpf on vhpf.handid = hp.handid and vhpf.playerid = hp.playerid
        left join v_hand_player_result vhpr on vhpr.handid = hp.handid and vhpr.playerid = hp.playerid
        where hp.playerid = player_rec.playerid
        and h.handstarttime::date = target_date
        and h.deletetime is null
        on conflict (playerid, day)
        do update set
            handsplayed = excluded.handsplayed,
            vpip = excluded.vpip,
            pfr = excluded.pfr,
            winning = excluded.winning,
            bbper100 = excluded.bbper100,
            updatetime = now();
    end loop;
end;
$$;


ALTER FUNCTION public.update_player_daily_stats(target_date date) OWNER TO chris0527;

--
-- TOC entry 267 (class 1255 OID 18432)
-- Name: update_updatetime_column(); Type: FUNCTION; Schema: public; Owner: chris0527
--

CREATE FUNCTION public.update_updatetime_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    new.updatetime = now();
    return new;
end;
$$;


ALTER FUNCTION public.update_updatetime_column() OWNER TO chris0527;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 251 (class 1259 OID 18191)
-- Name: auditlog; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.auditlog (
    id bigint NOT NULL,
    userid bigint,
    handid bigint,
    tablename character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    recordid bigint,
    beforedata jsonb,
    afterdata jsonb,
    ipaddress inet,
    useragent text,
    createtime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auditlog OWNER TO chris0527;

--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 251
-- Name: TABLE auditlog; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.auditlog IS '稽核日誌表';


--
-- TOC entry 250 (class 1259 OID 18189)
-- Name: auditlog_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.auditlog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditlog_id_seq OWNER TO chris0527;

--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 250
-- Name: auditlog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.auditlog_id_seq OWNED BY public.auditlog.id;


--
-- TOC entry 223 (class 1259 OID 17979)
-- Name: blindstructure; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.blindstructure (
    id bigint NOT NULL,
    sessionid bigint,
    tournamentid bigint,
    levelnumber integer NOT NULL,
    smallblind bigint NOT NULL,
    bigblind bigint NOT NULL,
    ante bigint DEFAULT 0 NOT NULL,
    durationminutes integer,
    breakafter boolean DEFAULT false,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.blindstructure OWNER TO chris0527;

--
-- TOC entry 222 (class 1259 OID 17977)
-- Name: blindstructure_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.blindstructure_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blindstructure_id_seq OWNER TO chris0527;

--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 222
-- Name: blindstructure_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.blindstructure_id_seq OWNED BY public.blindstructure.id;


--
-- TOC entry 231 (class 1259 OID 18037)
-- Name: communitycard; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.communitycard (
    id bigint NOT NULL,
    handid bigint NOT NULL,
    runno integer DEFAULT 1 NOT NULL,
    street character varying(10) NOT NULL,
    cards text[] NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.communitycard OWNER TO chris0527;

--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN communitycard.runno; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public.communitycard.runno IS 'RIT編號，對應不同的跑牌結果';


--
-- TOC entry 230 (class 1259 OID 18035)
-- Name: communitycard_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.communitycard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communitycard_id_seq OWNER TO chris0527;

--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 230
-- Name: communitycard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.communitycard_id_seq OWNED BY public.communitycard.id;


--
-- TOC entry 207 (class 1259 OID 17865)
-- Name: currency; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.currency (
    code character varying(10) NOT NULL,
    name character varying(50) NOT NULL,
    symbol character varying(10),
    decimals integer DEFAULT 2 NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.currency OWNER TO chris0527;

--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 207
-- Name: TABLE currency; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.currency IS '幣別表';


--
-- TOC entry 209 (class 1259 OID 17875)
-- Name: fxrate; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.fxrate (
    id bigint NOT NULL,
    basecurrency character varying(10) NOT NULL,
    quotecurrency character varying(10) NOT NULL,
    rate numeric(18,8) NOT NULL,
    asofdate date NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.fxrate OWNER TO chris0527;

--
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 209
-- Name: TABLE fxrate; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.fxrate IS '匯率表';


--
-- TOC entry 208 (class 1259 OID 17873)
-- Name: fxrate_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.fxrate_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fxrate_id_seq OWNER TO chris0527;

--
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 208
-- Name: fxrate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.fxrate_id_seq OWNED BY public.fxrate.id;


--
-- TOC entry 211 (class 1259 OID 17885)
-- Name: gametype; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.gametype (
    id bigint NOT NULL,
    typename character varying(50) NOT NULL,
    typecode character varying(20) NOT NULL,
    description text,
    minplayers integer DEFAULT 2,
    maxplayers integer DEFAULT 10,
    isactive boolean DEFAULT true,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.gametype OWNER TO chris0527;

--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 211
-- Name: TABLE gametype; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.gametype IS '遊戲類型配置表';


--
-- TOC entry 210 (class 1259 OID 17883)
-- Name: gametype_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.gametype_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gametype_id_seq OWNER TO chris0527;

--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 210
-- Name: gametype_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.gametype_id_seq OWNED BY public.gametype.id;


--
-- TOC entry 225 (class 1259 OID 17991)
-- Name: hand; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.hand (
    id bigint NOT NULL,
    sessionid bigint NOT NULL,
    handno character varying(50) NOT NULL,
    dealerseat integer NOT NULL,
    state character varying(20) DEFAULT 'created'::character varying NOT NULL,
    runittime integer DEFAULT 1 NOT NULL,
    smallblind bigint NOT NULL,
    bigblind bigint NOT NULL,
    ante bigint DEFAULT 0 NOT NULL,
    totalpot bigint DEFAULT 0,
    rake bigint DEFAULT 0,
    numplayersdealt integer,
    numplayerssawflop integer DEFAULT 0,
    numplayerssawturn integer DEFAULT 0,
    numplayerssawriver integer DEFAULT 0,
    numplayerssawshowdown integer DEFAULT 0,
    handstarttime timestamp with time zone DEFAULT now() NOT NULL,
    handendtime timestamp with time zone,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.hand OWNER TO chris0527;

--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE hand; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.hand IS '手牌主檔（事件溯源核心）';


--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN hand.runittime; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public.hand.runittime IS 'Run-it-twice次數，通常為1或2';


--
-- TOC entry 224 (class 1259 OID 17989)
-- Name: hand_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.hand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hand_id_seq OWNER TO chris0527;

--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 224
-- Name: hand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.hand_id_seq OWNED BY public.hand.id;


--
-- TOC entry 233 (class 1259 OID 18051)
-- Name: handaction; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.handaction (
    id bigint NOT NULL,
    handid bigint NOT NULL,
    seq integer NOT NULL,
    actiontime timestamp with time zone DEFAULT now() NOT NULL,
    playerid bigint,
    street character varying(10) NOT NULL,
    action character varying(30) NOT NULL,
    amount bigint DEFAULT 0 NOT NULL,
    topot boolean DEFAULT false NOT NULL,
    potsizebefore bigint DEFAULT 0,
    potsizeafter bigint DEFAULT 0,
    facingbet bigint DEFAULT 0,
    timetaken integer,
    isaggressive boolean DEFAULT false,
    runno integer DEFAULT 1 NOT NULL,
    meta jsonb,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.handaction OWNER TO chris0527;

--
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE handaction; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.handaction IS '手牌動作表（事件溯源）';


--
-- TOC entry 3568 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN handaction.seq; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public.handaction.seq IS '手牌內動作序號，必須嚴格遞增';


--
-- TOC entry 3569 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN handaction.topot; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public.handaction.topot IS '是否投入彩池（true表示投入，false表示退回）';


--
-- TOC entry 3570 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN handaction.isaggressive; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public.handaction.isaggressive IS '是否為激進動作（bet/raise/all_in）';


--
-- TOC entry 232 (class 1259 OID 18049)
-- Name: handaction_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.handaction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handaction_id_seq OWNER TO chris0527;

--
-- TOC entry 3571 (class 0 OID 0)
-- Dependencies: 232
-- Name: handaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.handaction_id_seq OWNED BY public.handaction.id;


--
-- TOC entry 245 (class 1259 OID 18149)
-- Name: handcategory; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.handcategory (
    id bigint NOT NULL,
    playerid bigint NOT NULL,
    handcategory character varying(50) NOT NULL,
    handsplayed integer DEFAULT 0,
    handswon integer DEFAULT 0,
    totalprofit bigint DEFAULT 0,
    winrate numeric(5,2),
    timeperiod character varying(20) DEFAULT 'all_time'::character varying,
    startdate date,
    enddate date,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.handcategory OWNER TO chris0527;

--
-- TOC entry 244 (class 1259 OID 18147)
-- Name: handcategory_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.handcategory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handcategory_id_seq OWNER TO chris0527;

--
-- TOC entry 3572 (class 0 OID 0)
-- Dependencies: 244
-- Name: handcategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.handcategory_id_seq OWNED BY public.handcategory.id;


--
-- TOC entry 227 (class 1259 OID 18011)
-- Name: handplayer; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.handplayer (
    id bigint NOT NULL,
    handid bigint NOT NULL,
    playerid bigint NOT NULL,
    seatno integer NOT NULL,
    "position" integer NOT NULL,
    seatorder integer NOT NULL,
    stackstart bigint NOT NULL,
    stackend bigint,
    holecards character varying(10),
    finalhand character varying(50),
    handstrength character varying(20),
    iswinner boolean DEFAULT false,
    amountwon bigint DEFAULT 0,
    netresult bigint,
    issmallblind boolean DEFAULT false,
    isbigblind boolean DEFAULT false,
    isstraddle boolean DEFAULT false,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.handplayer OWNER TO chris0527;

--
-- TOC entry 3573 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE handplayer; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.handplayer IS '手牌參與玩家表';


--
-- TOC entry 226 (class 1259 OID 18009)
-- Name: handplayer_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.handplayer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handplayer_id_seq OWNER TO chris0527;

--
-- TOC entry 3574 (class 0 OID 0)
-- Dependencies: 226
-- Name: handplayer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.handplayer_id_seq OWNED BY public.handplayer.id;


--
-- TOC entry 229 (class 1259 OID 18026)
-- Name: handplayercard; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.handplayercard (
    id bigint NOT NULL,
    handid bigint NOT NULL,
    playerid bigint NOT NULL,
    card1 character varying(3),
    card2 character varying(3),
    revealed boolean DEFAULT false NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.handplayercard OWNER TO chris0527;

--
-- TOC entry 228 (class 1259 OID 18024)
-- Name: handplayercard_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.handplayercard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handplayercard_id_seq OWNER TO chris0527;

--
-- TOC entry 3575 (class 0 OID 0)
-- Dependencies: 228
-- Name: handplayercard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.handplayercard_id_seq OWNED BY public.handplayercard.id;


--
-- TOC entry 235 (class 1259 OID 18072)
-- Name: handpot; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.handpot (
    id bigint NOT NULL,
    handid bigint NOT NULL,
    runno integer DEFAULT 1 NOT NULL,
    potno integer NOT NULL,
    amount bigint NOT NULL,
    ismain boolean DEFAULT false NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.handpot OWNER TO chris0527;

--
-- TOC entry 3576 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE handpot; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.handpot IS '主/邊池表';


--
-- TOC entry 3577 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN handpot.runno; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public.handpot.runno IS 'RIT編號，同一手牌可能有多組彩池';


--
-- TOC entry 234 (class 1259 OID 18070)
-- Name: handpot_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.handpot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handpot_id_seq OWNER TO chris0527;

--
-- TOC entry 3578 (class 0 OID 0)
-- Dependencies: 234
-- Name: handpot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.handpot_id_seq OWNED BY public.handpot.id;


--
-- TOC entry 237 (class 1259 OID 18084)
-- Name: handpotallocation; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.handpotallocation (
    id bigint NOT NULL,
    handpotid bigint NOT NULL,
    winnerplayerid bigint NOT NULL,
    amount bigint NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.handpotallocation OWNER TO chris0527;

--
-- TOC entry 3579 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE handpotallocation; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.handpotallocation IS '彩池分配表';


--
-- TOC entry 236 (class 1259 OID 18082)
-- Name: handpotallocation_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.handpotallocation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handpotallocation_id_seq OWNER TO chris0527;

--
-- TOC entry 3580 (class 0 OID 0)
-- Dependencies: 236
-- Name: handpotallocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.handpotallocation_id_seq OWNED BY public.handpotallocation.id;


--
-- TOC entry 239 (class 1259 OID 18094)
-- Name: handrake; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.handrake (
    id bigint NOT NULL,
    handid bigint NOT NULL,
    rakeamount bigint NOT NULL,
    feeamount bigint DEFAULT 0 NOT NULL,
    currency character varying(10) NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.handrake OWNER TO chris0527;

--
-- TOC entry 238 (class 1259 OID 18092)
-- Name: handrake_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.handrake_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handrake_id_seq OWNER TO chris0527;

--
-- TOC entry 3581 (class 0 OID 0)
-- Dependencies: 238
-- Name: handrake_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.handrake_id_seq OWNED BY public.handrake.id;


--
-- TOC entry 247 (class 1259 OID 18163)
-- Name: importsource; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.importsource (
    id bigint NOT NULL,
    orgid bigint NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    description text,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.importsource OWNER TO chris0527;

--
-- TOC entry 246 (class 1259 OID 18161)
-- Name: importsource_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.importsource_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.importsource_id_seq OWNER TO chris0527;

--
-- TOC entry 3582 (class 0 OID 0)
-- Dependencies: 246
-- Name: importsource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.importsource_id_seq OWNED BY public.importsource.id;


--
-- TOC entry 201 (class 1259 OID 17803)
-- Name: org; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.org (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    currency character varying(10) DEFAULT 'USD'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.org OWNER TO chris0527;

--
-- TOC entry 3583 (class 0 OID 0)
-- Dependencies: 201
-- Name: TABLE org; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.org IS '組織/俱樂部表';


--
-- TOC entry 200 (class 1259 OID 17801)
-- Name: org_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.org_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.org_id_seq OWNER TO chris0527;

--
-- TOC entry 3584 (class 0 OID 0)
-- Dependencies: 200
-- Name: org_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.org_id_seq OWNED BY public.org.id;


--
-- TOC entry 206 (class 1259 OID 17857)
-- Name: player; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.player (
    id bigint NOT NULL,
    orgid bigint NOT NULL,
    userid bigint,
    nickname character varying(100) NOT NULL,
    externalref character varying(100),
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.player OWNER TO chris0527;

--
-- TOC entry 3585 (class 0 OID 0)
-- Dependencies: 206
-- Name: TABLE player; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.player IS '玩家表（支援匿名玩家）';


--
-- TOC entry 205 (class 1259 OID 17855)
-- Name: player_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.player_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.player_id_seq OWNER TO chris0527;

--
-- TOC entry 3586 (class 0 OID 0)
-- Dependencies: 205
-- Name: player_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.player_id_seq OWNED BY public.player.id;


--
-- TOC entry 243 (class 1259 OID 18130)
-- Name: playerstatdaily; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.playerstatdaily (
    id bigint NOT NULL,
    playerid bigint NOT NULL,
    day date NOT NULL,
    handsplayed integer DEFAULT 0 NOT NULL,
    vpip integer DEFAULT 0 NOT NULL,
    pfr integer DEFAULT 0 NOT NULL,
    threebet integer DEFAULT 0 NOT NULL,
    cbet integer DEFAULT 0 NOT NULL,
    wtsd integer DEFAULT 0 NOT NULL,
    wsd integer DEFAULT 0 NOT NULL,
    winning bigint DEFAULT 0 NOT NULL,
    bbper100 numeric(8,2) DEFAULT 0 NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.playerstatdaily OWNER TO chris0527;

--
-- TOC entry 242 (class 1259 OID 18128)
-- Name: playerstatdaily_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.playerstatdaily_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playerstatdaily_id_seq OWNER TO chris0527;

--
-- TOC entry 3587 (class 0 OID 0)
-- Dependencies: 242
-- Name: playerstatdaily_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.playerstatdaily_id_seq OWNED BY public.playerstatdaily.id;


--
-- TOC entry 241 (class 1259 OID 18105)
-- Name: playerstatistic; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.playerstatistic (
    id bigint NOT NULL,
    playerid bigint NOT NULL,
    sessionid bigint,
    timeperiod character varying(20) DEFAULT 'all_time'::character varying,
    startdate date,
    enddate date,
    handsplayed integer DEFAULT 0,
    handswon integer DEFAULT 0,
    totalwinning bigint DEFAULT 0,
    totalrakepaid bigint DEFAULT 0,
    vpiphands integer DEFAULT 0,
    vpippercentage numeric(5,2),
    pfrhands integer DEFAULT 0,
    pfrpercentage numeric(5,2),
    totalbets integer DEFAULT 0,
    totalcalls integer DEFAULT 0,
    aggressionfactor numeric(5,2),
    earlypositionhands integer DEFAULT 0,
    middlepositionhands integer DEFAULT 0,
    latepositionhands integer DEFAULT 0,
    blindhands integer DEFAULT 0,
    wenttoshowdown integer DEFAULT 0,
    wonatshowdown integer DEFAULT 0,
    showdownwinpercentage numeric(5,2),
    threebetpercentage numeric(5,2),
    foldtothreebetpercentage numeric(5,2),
    cbetpercentage numeric(5,2),
    foldtocbetpercentage numeric(5,2),
    bbper100 numeric(8,2),
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.playerstatistic OWNER TO chris0527;

--
-- TOC entry 3588 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE playerstatistic; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.playerstatistic IS '玩家統計表';


--
-- TOC entry 240 (class 1259 OID 18103)
-- Name: playerstatistic_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.playerstatistic_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playerstatistic_id_seq OWNER TO chris0527;

--
-- TOC entry 3589 (class 0 OID 0)
-- Dependencies: 240
-- Name: playerstatistic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.playerstatistic_id_seq OWNED BY public.playerstatistic.id;


--
-- TOC entry 213 (class 1259 OID 17903)
-- Name: session; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.session (
    id bigint NOT NULL,
    userid bigint NOT NULL,
    orgid bigint,
    name character varying(100) NOT NULL,
    location character varying(100),
    description text,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone,
    starttime timestamp with time zone DEFAULT '2025-09-07 11:00:00+00'::timestamp with time zone NOT NULL,
    endtime timestamp with time zone DEFAULT '2025-09-07 11:00:00+00'::timestamp with time zone NOT NULL,
    buyin bigint DEFAULT 600 NOT NULL,
    chip bigint DEFAULT 20000 NOT NULL,
    gametype character varying DEFAULT 'limited'::character varying NOT NULL
);


ALTER TABLE public.session OWNER TO chris0527;

--
-- TOC entry 3590 (class 0 OID 0)
-- Dependencies: 213
-- Name: TABLE session; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.session IS '牌桌配置表';


--
-- TOC entry 212 (class 1259 OID 17901)
-- Name: pokertable_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.pokertable_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pokertable_id_seq OWNER TO chris0527;

--
-- TOC entry 3591 (class 0 OID 0)
-- Dependencies: 212
-- Name: pokertable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.pokertable_id_seq OWNED BY public.session.id;


--
-- TOC entry 249 (class 1259 OID 18176)
-- Name: rawhandhistory; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.rawhandhistory (
    id bigint NOT NULL,
    sourceid bigint NOT NULL,
    payload text NOT NULL,
    receivedtime timestamp with time zone DEFAULT now() NOT NULL,
    parsed boolean DEFAULT false NOT NULL,
    parseerror text,
    handid bigint,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.rawhandhistory OWNER TO chris0527;

--
-- TOC entry 248 (class 1259 OID 18174)
-- Name: rawhandhistory_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.rawhandhistory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rawhandhistory_id_seq OWNER TO chris0527;

--
-- TOC entry 3592 (class 0 OID 0)
-- Dependencies: 248
-- Name: rawhandhistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.rawhandhistory_id_seq OWNED BY public.rawhandhistory.id;


--
-- TOC entry 217 (class 1259 OID 17936)
-- Name: seating; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.seating (
    id bigint NOT NULL,
    sessionid bigint NOT NULL,
    seatno integer NOT NULL,
    playerid bigint NOT NULL,
    buyin bigint NOT NULL,
    stackbegin bigint NOT NULL,
    stackend bigint,
    rebuycount integer DEFAULT 0,
    jointime timestamp with time zone DEFAULT now() NOT NULL,
    leavetime timestamp with time zone,
    finalposition integer,
    isactive boolean DEFAULT true,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.seating OWNER TO chris0527;

--
-- TOC entry 3593 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE seating; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.seating IS '座位與買入表';


--
-- TOC entry 216 (class 1259 OID 17934)
-- Name: seating_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.seating_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seating_id_seq OWNER TO chris0527;

--
-- TOC entry 3594 (class 0 OID 0)
-- Dependencies: 216
-- Name: seating_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.seating_id_seq OWNED BY public.seating.id;


--
-- TOC entry 215 (class 1259 OID 17922)
-- Name: sessiontable; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.sessiontable (
    id bigint NOT NULL,
    sessionid bigint NOT NULL,
    name character varying(100),
    gametype character varying(20) DEFAULT 'cash_game'::character varying NOT NULL,
    gameformat character varying(20) DEFAULT 'nlhe'::character varying NOT NULL,
    stakelevel character varying(20),
    smallblind bigint NOT NULL,
    bigblind bigint NOT NULL,
    ante bigint DEFAULT 0 NOT NULL,
    allowstraddle boolean DEFAULT false NOT NULL,
    allowrunittwice boolean DEFAULT false NOT NULL,
    currency character varying(10) DEFAULT 'TWD'::character varying NOT NULL,
    raketype character varying(20) DEFAULT 'no_rake'::character varying NOT NULL,
    rakevalue numeric(8,4) DEFAULT 0 NOT NULL,
    rakecap bigint DEFAULT 0 NOT NULL,
    openedby bigint,
    closedby bigint,
    opentime timestamp with time zone DEFAULT now() NOT NULL,
    closetime timestamp with time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.sessiontable OWNER TO chris0527;

--
-- TOC entry 3595 (class 0 OID 0)
-- Dependencies: 215
-- Name: TABLE sessiontable; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.sessiontable IS '桌次營運表';


--
-- TOC entry 214 (class 1259 OID 17920)
-- Name: tablesession_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.tablesession_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tablesession_id_seq OWNER TO chris0527;

--
-- TOC entry 3596 (class 0 OID 0)
-- Dependencies: 214
-- Name: tablesession_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.tablesession_id_seq OWNED BY public.sessiontable.id;


--
-- TOC entry 203 (class 1259 OID 17819)
-- Name: user; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public."user" (
    id bigint NOT NULL,
    orgid bigint,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(100),
    avatarurl character varying(255),
    userlevel character varying(20) DEFAULT 'beginner'::character varying,
    totalhands integer DEFAULT 0,
    lastlogin timestamp with time zone,
    verified boolean DEFAULT false,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone,
    phone character varying(20),
    verifytoken character varying(50),
    token character varying(50),
    country character varying(50),
    timezone character varying(50),
    language character varying(10) DEFAULT 'en'::character varying,
    privacylevel character varying(20) DEFAULT 'public'::character varying,
    permission integer DEFAULT 1
);


ALTER TABLE public."user" OWNER TO chris0527;

--
-- TOC entry 3597 (class 0 OID 0)
-- Dependencies: 203
-- Name: TABLE "user"; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public."user" IS '用戶表';


--
-- TOC entry 3598 (class 0 OID 0)
-- Dependencies: 203
-- Name: COLUMN "user".verifytoken; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public."user".verifytoken IS '信箱驗證用';


--
-- TOC entry 3599 (class 0 OID 0)
-- Dependencies: 203
-- Name: COLUMN "user".permission; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON COLUMN public."user".permission IS '使用者權限1(使用者)~5(管理者)';


--
-- TOC entry 202 (class 1259 OID 17817)
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO chris0527;

--
-- TOC entry 3600 (class 0 OID 0)
-- Dependencies: 202
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 204 (class 1259 OID 17838)
-- Name: token; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.token (
    id bigint DEFAULT nextval('public.user_id_seq'::regclass) NOT NULL,
    userid bigint NOT NULL,
    token character varying(50) NOT NULL,
    createtime timestamp with time zone NOT NULL
);


ALTER TABLE public.token OWNER TO chris0527;

--
-- TOC entry 219 (class 1259 OID 17949)
-- Name: tournament; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.tournament (
    id bigint NOT NULL,
    orgid bigint NOT NULL,
    name character varying(100) NOT NULL,
    buyin bigint NOT NULL,
    fee bigint DEFAULT 0 NOT NULL,
    startingstack bigint NOT NULL,
    structure jsonb NOT NULL,
    maxplayers integer,
    rebuyallowed boolean DEFAULT false,
    addonallowed boolean DEFAULT false,
    starttime timestamp with time zone,
    endtime timestamp with time zone,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.tournament OWNER TO chris0527;

--
-- TOC entry 3601 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE tournament; Type: COMMENT; Schema: public; Owner: chris0527
--

COMMENT ON TABLE public.tournament IS '錦標賽表';


--
-- TOC entry 218 (class 1259 OID 17947)
-- Name: tournament_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.tournament_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournament_id_seq OWNER TO chris0527;

--
-- TOC entry 3602 (class 0 OID 0)
-- Dependencies: 218
-- Name: tournament_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.tournament_id_seq OWNED BY public.tournament.id;


--
-- TOC entry 221 (class 1259 OID 17966)
-- Name: tournamententry; Type: TABLE; Schema: public; Owner: chris0527
--

CREATE TABLE public.tournamententry (
    id bigint NOT NULL,
    tournamentid bigint NOT NULL,
    playerid bigint NOT NULL,
    seatno integer,
    reentryno integer DEFAULT 0 NOT NULL,
    chips bigint NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    finalposition integer,
    prizeamount bigint DEFAULT 0,
    createtime timestamp with time zone DEFAULT now() NOT NULL,
    updatetime timestamp with time zone DEFAULT now() NOT NULL,
    deletetime timestamp with time zone
);


ALTER TABLE public.tournamententry OWNER TO chris0527;

--
-- TOC entry 220 (class 1259 OID 17964)
-- Name: tournamententry_id_seq; Type: SEQUENCE; Schema: public; Owner: chris0527
--

CREATE SEQUENCE public.tournamententry_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournamententry_id_seq OWNER TO chris0527;

--
-- TOC entry 3603 (class 0 OID 0)
-- Dependencies: 220
-- Name: tournamententry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chris0527
--

ALTER SEQUENCE public.tournamententry_id_seq OWNED BY public.tournamententry.id;


--
-- TOC entry 254 (class 1259 OID 18469)
-- Name: v_hand_complete; Type: VIEW; Schema: public; Owner: chris0527
--

CREATE VIEW public.v_hand_complete AS
 SELECT h.id AS handid,
    h.handno,
    h.handstarttime,
    h.handendtime,
    h.state,
    h.dealerseat,
    h.smallblind,
    h.bigblind,
    h.ante,
    h.totalpot,
    h.rake,
    ts.name AS sessionname,
    pt.name AS tablename,
    json_agg(json_build_object('playerid', hp.playerid, 'playername', p.nickname, 'seatno', hp.seatno, 'position', hp."position", 'stackstart', hp.stackstart, 'stackend', hp.stackend, 'holecards', hp.holecards, 'finalhand', hp.finalhand, 'iswinner', hp.iswinner, 'amountwon', hp.amountwon, 'netresult', hp.netresult)) AS players
   FROM ((((public.hand h
     JOIN public.sessiontable ts ON ((ts.id = h.sessionid)))
     JOIN public.session pt ON ((pt.id = ts.sessionid)))
     JOIN public.handplayer hp ON ((hp.handid = h.id)))
     JOIN public.player p ON ((p.id = hp.playerid)))
  WHERE (h.deletetime IS NULL)
  GROUP BY h.id, h.handno, h.handstarttime, h.handendtime, h.state, h.dealerseat, h.smallblind, h.bigblind, h.ante, h.totalpot, h.rake, ts.name, pt.name;


ALTER VIEW public.v_hand_complete OWNER TO chris0527;

--
-- TOC entry 252 (class 1259 OID 18459)
-- Name: v_hand_player_preflop; Type: VIEW; Schema: public; Owner: chris0527
--

CREATE VIEW public.v_hand_player_preflop AS
 SELECT hp.handid,
    hp.playerid,
    bool_or((((ha.action)::text = ANY ((ARRAY['call'::character varying, 'bet'::character varying, 'raise'::character varying, 'post_straddle'::character varying])::text[])) AND ((ha.street)::text = 'preflop'::text) AND ha.topot)) AS vpip,
    bool_or((((ha.action)::text = 'raise'::text) AND ((ha.street)::text = 'preflop'::text))) AS pfr
   FROM (public.handplayer hp
     LEFT JOIN public.handaction ha ON (((ha.handid = hp.handid) AND (ha.playerid = hp.playerid))))
  GROUP BY hp.handid, hp.playerid;


ALTER VIEW public.v_hand_player_preflop OWNER TO chris0527;

--
-- TOC entry 253 (class 1259 OID 18464)
-- Name: v_hand_player_result; Type: VIEW; Schema: public; Owner: chris0527
--

CREATE VIEW public.v_hand_player_result AS
 SELECT hp.handid,
    hp.playerid,
    (COALESCE(sum(
        CASE
            WHEN ha.topot THEN (- ha.amount)
            WHEN ((ha.action)::text = 'return_uncalled'::text) THEN ha.amount
            ELSE (0)::bigint
        END), (0)::numeric) + COALESCE(( SELECT sum(hpa.amount) AS sum
           FROM (public.handpotallocation hpa
             JOIN public.handpot hpt ON ((hpt.id = hpa.handpotid)))
          WHERE ((hpt.handid = hp.handid) AND (hpa.winnerplayerid = hp.playerid))), (0)::numeric)) AS netamount
   FROM (public.handplayer hp
     LEFT JOIN public.handaction ha ON (((ha.handid = hp.handid) AND (ha.playerid = hp.playerid))))
  GROUP BY hp.handid, hp.playerid;


ALTER VIEW public.v_hand_player_result OWNER TO chris0527;

--
-- TOC entry 3208 (class 2604 OID 18194)
-- Name: auditlog id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.auditlog ALTER COLUMN id SET DEFAULT nextval('public.auditlog_id_seq'::regclass);


--
-- TOC entry 3106 (class 2604 OID 17982)
-- Name: blindstructure id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.blindstructure ALTER COLUMN id SET DEFAULT nextval('public.blindstructure_id_seq'::regclass);


--
-- TOC entry 3136 (class 2604 OID 18040)
-- Name: communitycard id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.communitycard ALTER COLUMN id SET DEFAULT nextval('public.communitycard_id_seq'::regclass);


--
-- TOC entry 3056 (class 2604 OID 17878)
-- Name: fxrate id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.fxrate ALTER COLUMN id SET DEFAULT nextval('public.fxrate_id_seq'::regclass);


--
-- TOC entry 3059 (class 2604 OID 17888)
-- Name: gametype id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.gametype ALTER COLUMN id SET DEFAULT nextval('public.gametype_id_seq'::regclass);


--
-- TOC entry 3111 (class 2604 OID 17994)
-- Name: hand id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.hand ALTER COLUMN id SET DEFAULT nextval('public.hand_id_seq'::regclass);


--
-- TOC entry 3140 (class 2604 OID 18054)
-- Name: handaction id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handaction ALTER COLUMN id SET DEFAULT nextval('public.handaction_id_seq'::regclass);


--
-- TOC entry 3193 (class 2604 OID 18152)
-- Name: handcategory id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handcategory ALTER COLUMN id SET DEFAULT nextval('public.handcategory_id_seq'::regclass);


--
-- TOC entry 3124 (class 2604 OID 18014)
-- Name: handplayer id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayer ALTER COLUMN id SET DEFAULT nextval('public.handplayer_id_seq'::regclass);


--
-- TOC entry 3132 (class 2604 OID 18029)
-- Name: handplayercard id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayercard ALTER COLUMN id SET DEFAULT nextval('public.handplayercard_id_seq'::regclass);


--
-- TOC entry 3151 (class 2604 OID 18075)
-- Name: handpot id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handpot ALTER COLUMN id SET DEFAULT nextval('public.handpot_id_seq'::regclass);


--
-- TOC entry 3156 (class 2604 OID 18087)
-- Name: handpotallocation id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handpotallocation ALTER COLUMN id SET DEFAULT nextval('public.handpotallocation_id_seq'::regclass);


--
-- TOC entry 3159 (class 2604 OID 18097)
-- Name: handrake id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handrake ALTER COLUMN id SET DEFAULT nextval('public.handrake_id_seq'::regclass);


--
-- TOC entry 3200 (class 2604 OID 18166)
-- Name: importsource id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.importsource ALTER COLUMN id SET DEFAULT nextval('public.importsource_id_seq'::regclass);


--
-- TOC entry 3034 (class 2604 OID 17806)
-- Name: org id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.org ALTER COLUMN id SET DEFAULT nextval('public.org_id_seq'::regclass);


--
-- TOC entry 3050 (class 2604 OID 17860)
-- Name: player id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.player ALTER COLUMN id SET DEFAULT nextval('public.player_id_seq'::regclass);


--
-- TOC entry 3181 (class 2604 OID 18133)
-- Name: playerstatdaily id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.playerstatdaily ALTER COLUMN id SET DEFAULT nextval('public.playerstatdaily_id_seq'::regclass);


--
-- TOC entry 3163 (class 2604 OID 18108)
-- Name: playerstatistic id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.playerstatistic ALTER COLUMN id SET DEFAULT nextval('public.playerstatistic_id_seq'::regclass);


--
-- TOC entry 3203 (class 2604 OID 18179)
-- Name: rawhandhistory id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.rawhandhistory ALTER COLUMN id SET DEFAULT nextval('public.rawhandhistory_id_seq'::regclass);


--
-- TOC entry 3087 (class 2604 OID 17939)
-- Name: seating id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.seating ALTER COLUMN id SET DEFAULT nextval('public.seating_id_seq'::regclass);


--
-- TOC entry 3065 (class 2604 OID 17906)
-- Name: session id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.session ALTER COLUMN id SET DEFAULT nextval('public.pokertable_id_seq'::regclass);


--
-- TOC entry 3080 (class 2604 OID 17925)
-- Name: sessiontable id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.sessiontable ALTER COLUMN id SET DEFAULT nextval('public.tablesession_id_seq'::regclass);


--
-- TOC entry 3093 (class 2604 OID 17952)
-- Name: tournament id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.tournament ALTER COLUMN id SET DEFAULT nextval('public.tournament_id_seq'::regclass);


--
-- TOC entry 3100 (class 2604 OID 17969)
-- Name: tournamententry id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.tournamententry ALTER COLUMN id SET DEFAULT nextval('public.tournamententry_id_seq'::regclass);


--
-- TOC entry 3040 (class 2604 OID 17822)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 3546 (class 0 OID 18191)
-- Dependencies: 251
-- Data for Name: auditlog; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.auditlog (id, userid, handid, tablename, action, recordid, beforedata, afterdata, ipaddress, useragent, createtime) FROM stdin;
\.


--
-- TOC entry 3518 (class 0 OID 17979)
-- Dependencies: 223
-- Data for Name: blindstructure; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.blindstructure (id, sessionid, tournamentid, levelnumber, smallblind, bigblind, ante, durationminutes, breakafter, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3526 (class 0 OID 18037)
-- Dependencies: 231
-- Data for Name: communitycard; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.communitycard (id, handid, runno, street, cards, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3502 (class 0 OID 17865)
-- Dependencies: 207
-- Data for Name: currency; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.currency (code, name, symbol, decimals, createtime, updatetime, deletetime) FROM stdin;
USD	US Dollar	$	2	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
TWD	Taiwan Dollar	NT$	0	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
EUR	Euro	€	2	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
CNY	Chinese Yuan	¥	2	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
JPY	Japanese Yen	¥	0	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
\.


--
-- TOC entry 3504 (class 0 OID 17875)
-- Dependencies: 209
-- Data for Name: fxrate; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.fxrate (id, basecurrency, quotecurrency, rate, asofdate, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3506 (class 0 OID 17885)
-- Dependencies: 211
-- Data for Name: gametype; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.gametype (id, typename, typecode, description, minplayers, maxplayers, isactive, createtime, updatetime, deletetime) FROM stdin;
1	No Limit Hold'em	nlhe	No Limit Texas Hold'em	2	10	t	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
2	Pot Limit Omaha	plo	Pot Limit Omaha	2	10	t	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
3	Limit Hold'em	limit_he	Limit Texas Hold'em	2	10	t	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
4	Mixed Games	mixed	Mixed poker games	2	10	t	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
\.


--
-- TOC entry 3520 (class 0 OID 17991)
-- Dependencies: 225
-- Data for Name: hand; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.hand (id, sessionid, handno, dealerseat, state, runittime, smallblind, bigblind, ante, totalpot, rake, numplayersdealt, numplayerssawflop, numplayerssawturn, numplayerssawriver, numplayerssawshowdown, handstarttime, handendtime, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3528 (class 0 OID 18051)
-- Dependencies: 233
-- Data for Name: handaction; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.handaction (id, handid, seq, actiontime, playerid, street, action, amount, topot, potsizebefore, potsizeafter, facingbet, timetaken, isaggressive, runno, meta, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3540 (class 0 OID 18149)
-- Dependencies: 245
-- Data for Name: handcategory; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.handcategory (id, playerid, handcategory, handsplayed, handswon, totalprofit, winrate, timeperiod, startdate, enddate, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3522 (class 0 OID 18011)
-- Dependencies: 227
-- Data for Name: handplayer; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.handplayer (id, handid, playerid, seatno, "position", seatorder, stackstart, stackend, holecards, finalhand, handstrength, iswinner, amountwon, netresult, issmallblind, isbigblind, isstraddle, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3524 (class 0 OID 18026)
-- Dependencies: 229
-- Data for Name: handplayercard; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.handplayercard (id, handid, playerid, card1, card2, revealed, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3530 (class 0 OID 18072)
-- Dependencies: 235
-- Data for Name: handpot; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.handpot (id, handid, runno, potno, amount, ismain, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3532 (class 0 OID 18084)
-- Dependencies: 237
-- Data for Name: handpotallocation; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.handpotallocation (id, handpotid, winnerplayerid, amount, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3534 (class 0 OID 18094)
-- Dependencies: 239
-- Data for Name: handrake; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.handrake (id, handid, rakeamount, feeamount, currency, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3542 (class 0 OID 18163)
-- Dependencies: 247
-- Data for Name: importsource; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.importsource (id, orgid, name, type, description, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3496 (class 0 OID 17803)
-- Dependencies: 201
-- Data for Name: org; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.org (id, name, description, timezone, currency, status, createtime, updatetime, deletetime) FROM stdin;
1	Demo Poker Club	示例撲克俱樂部	Asia/Taipei	TWD	active	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
\.


--
-- TOC entry 3501 (class 0 OID 17857)
-- Dependencies: 206
-- Data for Name: player; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.player (id, orgid, userid, nickname, externalref, createtime, updatetime, deletetime) FROM stdin;
1	1	\N	Alice	\N	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
2	1	\N	Bob	\N	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
3	1	\N	Charlie	\N	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
4	1	\N	Diana	\N	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
5	1	\N	Eve	\N	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
6	1	\N	Frank	\N	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N
\.


--
-- TOC entry 3538 (class 0 OID 18130)
-- Dependencies: 243
-- Data for Name: playerstatdaily; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.playerstatdaily (id, playerid, day, handsplayed, vpip, pfr, threebet, cbet, wtsd, wsd, winning, bbper100, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3536 (class 0 OID 18105)
-- Dependencies: 241
-- Data for Name: playerstatistic; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.playerstatistic (id, playerid, sessionid, timeperiod, startdate, enddate, handsplayed, handswon, totalwinning, totalrakepaid, vpiphands, vpippercentage, pfrhands, pfrpercentage, totalbets, totalcalls, aggressionfactor, earlypositionhands, middlepositionhands, latepositionhands, blindhands, wenttoshowdown, wonatshowdown, showdownwinpercentage, threebetpercentage, foldtothreebetpercentage, cbetpercentage, foldtocbetpercentage, bbper100, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3544 (class 0 OID 18176)
-- Dependencies: 249
-- Data for Name: rawhandhistory; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.rawhandhistory (id, sourceid, payload, receivedtime, parsed, parseerror, handid, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3512 (class 0 OID 17936)
-- Dependencies: 217
-- Data for Name: seating; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.seating (id, sessionid, seatno, playerid, buyin, stackbegin, stackend, rebuycount, jointime, leavetime, finalposition, isactive, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3508 (class 0 OID 17903)
-- Dependencies: 213
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.session (id, orgid, name, smallblind, bigblind, ante, allowstraddle, allowrunittwice, currency, raketype, rakevalue, rakecap, location, description, createtime, updatetime, deletetime, userid, starttime, endtime, buyin, chips, gametype) FROM stdin;
2	1	Table 2 - NL50	50	100	0	f	f	TWD	percent	5.0000	0	\N	\N	2025-09-05 16:52:59.455455+00	2025-09-06 09:56:59.656284+00	\N	5	2025-09-07 11:00:00+00	2025-09-07 11:00:00+00	600	20000	limited
1	1	Table 1 - NL25	25	50	0	f	f	TWD	percent	5.0000	0	\N	\N	2025-09-05 16:52:59.455455+00	2025-09-06 10:03:33.055445+00	\N	1	2025-09-07 11:00:00+00	2025-09-07 11:00:00+00	600	20000	limited
3	\N	da	25	50	5	f	f	TWD	no_rake	0.0000	0	asd	da	2025-09-07 09:12:21.076676+00	2025-09-07 09:12:21.076676+00	\N	5	2025-09-07 11:00:00+00	2025-09-07 15:30:00+00	2000	2000	cash
4	\N	600買入限時錦標賽	100	200	200	f	f	TWD	no_rake	0.0000	0	公館dr.poker	600限時體驗 賺了500塊	2025-09-08 07:13:21.714471+00	2025-09-08 07:13:21.714471+00	\N	5	2025-09-08 10:00:00+00	2025-09-08 11:00:00+00	600	20000	limited
5	\N	eee	25	50	5	f	f	TWD	no_rake	0.0000	0	xxx	fff	2025-09-09 02:31:41.541835+00	2025-09-09 02:31:41.541835+00	\N	5	2025-09-09 11:00:00+00	2025-09-09 15:30:00+00	2000	2000	tournament
\.


--
-- TOC entry 3510 (class 0 OID 17922)
-- Dependencies: 215
-- Data for Name: sessiontable; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.sessiontable (id, sessionid, name, gametype, gameformat, stakelevel, openedby, closedby, opentime, closetime, status, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3499 (class 0 OID 17838)
-- Dependencies: 204
-- Data for Name: token; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.token (id, userid, token, createtime) FROM stdin;
6	5	ft9DnpcdMfWTF8Bvn0iKRKnXLhJMvuvMOSP	2025-09-06 14:05:37+00
7	5	aanGS6QsVsZ49Fb1GrmssLoB6qvrseAejtH	2025-09-06 17:34:47+00
8	5	z3f8fUjx94cyT26stFbqShemMvtWBzdBcNh	2025-09-06 17:38:08+00
9	5	PotO5CtSXsPNK9akSTVtAYl9t9YoTwaiwkF	2025-09-06 17:57:40+00
10	5	S9qJXF1pTps86PxI87TN2A9I0wBkJTBxBRT	2025-09-06 17:59:02+00
11	5	1Mx5o8DRXkftWe34jmV7daiIuKiudLXizgR	2025-09-06 18:01:16+00
12	5	WsTsnGd1umDkLZFK5rsFcq9PvL3VSBWqXof	2025-09-06 18:03:16+00
13	5	NYfAu7J447srcIQJK9gkRnM6wgZcqUA9nGp	2025-09-08 00:00:10+00
14	5	8laKBt2zkJhEPUCGGFrIFtbYInjJ5MOHNJt	2025-09-08 15:08:39+00
\.


--
-- TOC entry 3514 (class 0 OID 17949)
-- Dependencies: 219
-- Data for Name: tournament; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.tournament (id, orgid, name, buyin, fee, startingstack, structure, maxplayers, rebuyallowed, addonallowed, starttime, endtime, status, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3516 (class 0 OID 17966)
-- Dependencies: 221
-- Data for Name: tournamententry; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public.tournamententry (id, tournamentid, playerid, seatno, reentryno, chips, status, finalposition, prizeamount, createtime, updatetime, deletetime) FROM stdin;
\.


--
-- TOC entry 3498 (class 0 OID 17819)
-- Dependencies: 203
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: chris0527
--

COPY public."user" (id, orgid, username, email, password, name, avatarurl, userlevel, totalhands, lastlogin, verified, createtime, updatetime, deletetime, phone, verifytoken, token, country, timezone, language, privacylevel, permission) FROM stdin;
2	1	dealer1	dealer1@demo.com	$2b$12$example_hash	Dealer One	\N	beginner	0	\N	t	2025-09-05 16:52:59.455455+00	2025-09-05 16:52:59.455455+00	\N	\N	\N	\N	\N	\N	en	public	1
5	\N	chris0527	chris960527ho@gmail.com	$2b$12$3IoV8RPSp6dgcomzv06gkuLNCkcttex6w0Y9mVnliqfpYpP84H1Pe	賀皓群	\N	beginner	0	\N	t	2025-09-06 01:30:08+00	2025-09-05 17:34:04.714265+00	\N	0906585605	1r68koROJDp7jfPMb7PJe5gEv	127bc71c-4c3e-48c5-9257-1b78eb17af4c	\N	\N	en	public	1
1	1	admin	admin@demo.com	$2b$12$example_hash	Administrator	\N	beginner	0	\N	t	2025-09-05 16:52:59.455455+00	2025-09-06 09:56:34.479781+00	\N	\N	\N	\N	\N	\N	en	public	5
\.


--
-- TOC entry 3604 (class 0 OID 0)
-- Dependencies: 250
-- Name: auditlog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.auditlog_id_seq', 1, false);


--
-- TOC entry 3605 (class 0 OID 0)
-- Dependencies: 222
-- Name: blindstructure_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.blindstructure_id_seq', 1, false);


--
-- TOC entry 3606 (class 0 OID 0)
-- Dependencies: 230
-- Name: communitycard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.communitycard_id_seq', 1, false);


--
-- TOC entry 3607 (class 0 OID 0)
-- Dependencies: 208
-- Name: fxrate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.fxrate_id_seq', 1, false);


--
-- TOC entry 3608 (class 0 OID 0)
-- Dependencies: 210
-- Name: gametype_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.gametype_id_seq', 4, true);


--
-- TOC entry 3609 (class 0 OID 0)
-- Dependencies: 224
-- Name: hand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.hand_id_seq', 1, false);


--
-- TOC entry 3610 (class 0 OID 0)
-- Dependencies: 232
-- Name: handaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.handaction_id_seq', 1, false);


--
-- TOC entry 3611 (class 0 OID 0)
-- Dependencies: 244
-- Name: handcategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.handcategory_id_seq', 1, false);


--
-- TOC entry 3612 (class 0 OID 0)
-- Dependencies: 226
-- Name: handplayer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.handplayer_id_seq', 1, false);


--
-- TOC entry 3613 (class 0 OID 0)
-- Dependencies: 228
-- Name: handplayercard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.handplayercard_id_seq', 1, false);


--
-- TOC entry 3614 (class 0 OID 0)
-- Dependencies: 234
-- Name: handpot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.handpot_id_seq', 1, false);


--
-- TOC entry 3615 (class 0 OID 0)
-- Dependencies: 236
-- Name: handpotallocation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.handpotallocation_id_seq', 1, false);


--
-- TOC entry 3616 (class 0 OID 0)
-- Dependencies: 238
-- Name: handrake_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.handrake_id_seq', 1, false);


--
-- TOC entry 3617 (class 0 OID 0)
-- Dependencies: 246
-- Name: importsource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.importsource_id_seq', 1, false);


--
-- TOC entry 3618 (class 0 OID 0)
-- Dependencies: 200
-- Name: org_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.org_id_seq', 1, true);


--
-- TOC entry 3619 (class 0 OID 0)
-- Dependencies: 205
-- Name: player_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.player_id_seq', 6, true);


--
-- TOC entry 3620 (class 0 OID 0)
-- Dependencies: 242
-- Name: playerstatdaily_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.playerstatdaily_id_seq', 1, false);


--
-- TOC entry 3621 (class 0 OID 0)
-- Dependencies: 240
-- Name: playerstatistic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.playerstatistic_id_seq', 1, false);


--
-- TOC entry 3622 (class 0 OID 0)
-- Dependencies: 212
-- Name: pokertable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.pokertable_id_seq', 5, true);


--
-- TOC entry 3623 (class 0 OID 0)
-- Dependencies: 248
-- Name: rawhandhistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.rawhandhistory_id_seq', 1, false);


--
-- TOC entry 3624 (class 0 OID 0)
-- Dependencies: 216
-- Name: seating_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.seating_id_seq', 1, false);


--
-- TOC entry 3625 (class 0 OID 0)
-- Dependencies: 214
-- Name: tablesession_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.tablesession_id_seq', 1, false);


--
-- TOC entry 3626 (class 0 OID 0)
-- Dependencies: 218
-- Name: tournament_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.tournament_id_seq', 1, false);


--
-- TOC entry 3627 (class 0 OID 0)
-- Dependencies: 220
-- Name: tournamententry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.tournamententry_id_seq', 1, false);


--
-- TOC entry 3628 (class 0 OID 0)
-- Dependencies: 202
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chris0527
--

SELECT pg_catalog.setval('public.user_id_seq', 14, true);


--
-- TOC entry 3295 (class 2606 OID 18200)
-- Name: auditlog auditlog_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.auditlog
    ADD CONSTRAINT auditlog_pkey PRIMARY KEY (id);


--
-- TOC entry 3247 (class 2606 OID 17988)
-- Name: blindstructure blindstructure_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.blindstructure
    ADD CONSTRAINT blindstructure_pkey PRIMARY KEY (id);


--
-- TOC entry 3263 (class 2606 OID 18048)
-- Name: communitycard communitycard_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.communitycard
    ADD CONSTRAINT communitycard_pkey PRIMARY KEY (id);


--
-- TOC entry 3225 (class 2606 OID 17872)
-- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (code);


--
-- TOC entry 3228 (class 2606 OID 17882)
-- Name: fxrate fxrate_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.fxrate
    ADD CONSTRAINT fxrate_pkey PRIMARY KEY (id);


--
-- TOC entry 3230 (class 2606 OID 17898)
-- Name: gametype gametype_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.gametype
    ADD CONSTRAINT gametype_pkey PRIMARY KEY (id);


--
-- TOC entry 3232 (class 2606 OID 17900)
-- Name: gametype gametype_typecode_key; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.gametype
    ADD CONSTRAINT gametype_typecode_key UNIQUE (typecode);


--
-- TOC entry 3249 (class 2606 OID 18008)
-- Name: hand hand_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.hand
    ADD CONSTRAINT hand_pkey PRIMARY KEY (id);


--
-- TOC entry 3267 (class 2606 OID 18069)
-- Name: handaction handaction_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handaction
    ADD CONSTRAINT handaction_pkey PRIMARY KEY (id);


--
-- TOC entry 3289 (class 2606 OID 18160)
-- Name: handcategory handcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handcategory
    ADD CONSTRAINT handcategory_pkey PRIMARY KEY (id);


--
-- TOC entry 3256 (class 2606 OID 18023)
-- Name: handplayer handplayer_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayer
    ADD CONSTRAINT handplayer_pkey PRIMARY KEY (id);


--
-- TOC entry 3260 (class 2606 OID 18034)
-- Name: handplayercard handplayercard_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayercard
    ADD CONSTRAINT handplayercard_pkey PRIMARY KEY (id);


--
-- TOC entry 3273 (class 2606 OID 18081)
-- Name: handpot handpot_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handpot
    ADD CONSTRAINT handpot_pkey PRIMARY KEY (id);


--
-- TOC entry 3276 (class 2606 OID 18091)
-- Name: handpotallocation handpotallocation_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handpotallocation
    ADD CONSTRAINT handpotallocation_pkey PRIMARY KEY (id);


--
-- TOC entry 3279 (class 2606 OID 18102)
-- Name: handrake handrake_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handrake
    ADD CONSTRAINT handrake_pkey PRIMARY KEY (id);


--
-- TOC entry 3291 (class 2606 OID 18173)
-- Name: importsource importsource_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.importsource
    ADD CONSTRAINT importsource_pkey PRIMARY KEY (id);


--
-- TOC entry 3211 (class 2606 OID 17816)
-- Name: org org_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT org_pkey PRIMARY KEY (id);


--
-- TOC entry 3223 (class 2606 OID 17864)
-- Name: player player_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_pkey PRIMARY KEY (id);


--
-- TOC entry 3286 (class 2606 OID 18146)
-- Name: playerstatdaily playerstatdaily_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.playerstatdaily
    ADD CONSTRAINT playerstatdaily_pkey PRIMARY KEY (id);


--
-- TOC entry 3282 (class 2606 OID 18127)
-- Name: playerstatistic playerstatistic_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.playerstatistic
    ADD CONSTRAINT playerstatistic_pkey PRIMARY KEY (id);


--
-- TOC entry 3234 (class 2606 OID 17919)
-- Name: session pokertable_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT pokertable_pkey PRIMARY KEY (id);


--
-- TOC entry 3293 (class 2606 OID 18188)
-- Name: rawhandhistory rawhandhistory_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.rawhandhistory
    ADD CONSTRAINT rawhandhistory_pkey PRIMARY KEY (id);


--
-- TOC entry 3239 (class 2606 OID 17946)
-- Name: seating seating_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.seating
    ADD CONSTRAINT seating_pkey PRIMARY KEY (id);


--
-- TOC entry 3236 (class 2606 OID 17933)
-- Name: sessiontable tablesession_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.sessiontable
    ADD CONSTRAINT tablesession_pkey PRIMARY KEY (id);


--
-- TOC entry 3220 (class 2606 OID 17842)
-- Name: token token_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.token
    ADD CONSTRAINT token_pkey PRIMARY KEY (id);


--
-- TOC entry 3242 (class 2606 OID 17963)
-- Name: tournament tournament_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.tournament
    ADD CONSTRAINT tournament_pkey PRIMARY KEY (id);


--
-- TOC entry 3244 (class 2606 OID 17976)
-- Name: tournamententry tournamententry_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.tournamententry
    ADD CONSTRAINT tournamententry_pkey PRIMARY KEY (id);


--
-- TOC entry 3214 (class 2606 OID 17837)
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- TOC entry 3216 (class 2606 OID 17833)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 3218 (class 2606 OID 17835)
-- Name: user user_username_key; Type: CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- TOC entry 3261 (class 1259 OID 18214)
-- Name: communitycard_handid_runno_street_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX communitycard_handid_runno_street_idx ON public.communitycard USING btree (handid, runno, street);


--
-- TOC entry 3226 (class 1259 OID 18203)
-- Name: fxrate_basecurrency_quotecurrency_asofdate_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX fxrate_basecurrency_quotecurrency_asofdate_idx ON public.fxrate USING btree (basecurrency, quotecurrency, asofdate);


--
-- TOC entry 3250 (class 1259 OID 18207)
-- Name: hand_sessionid_handno_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX hand_sessionid_handno_idx ON public.hand USING btree (sessionid, handno);


--
-- TOC entry 3265 (class 1259 OID 18216)
-- Name: handaction_handid_seq_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX handaction_handid_seq_idx ON public.handaction USING btree (handid, seq);


--
-- TOC entry 3253 (class 1259 OID 18210)
-- Name: handplayer_handid_playerid_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX handplayer_handid_playerid_idx ON public.handplayer USING btree (handid, playerid);


--
-- TOC entry 3254 (class 1259 OID 18211)
-- Name: handplayer_handid_seatno_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX handplayer_handid_seatno_idx ON public.handplayer USING btree (handid, seatno);


--
-- TOC entry 3258 (class 1259 OID 18213)
-- Name: handplayercard_handid_playerid_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX handplayercard_handid_playerid_idx ON public.handplayercard USING btree (handid, playerid);


--
-- TOC entry 3271 (class 1259 OID 18220)
-- Name: handpot_handid_runno_potno_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX handpot_handid_runno_potno_idx ON public.handpot USING btree (handid, runno, potno);


--
-- TOC entry 3264 (class 1259 OID 18215)
-- Name: idx_communitycard_hand_run; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_communitycard_hand_run ON public.communitycard USING btree (handid, runno);


--
-- TOC entry 3251 (class 1259 OID 18209)
-- Name: idx_hand_session_handno; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_hand_session_handno ON public.hand USING btree (sessionid, handno);


--
-- TOC entry 3252 (class 1259 OID 18208)
-- Name: idx_hand_session_time; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_hand_session_time ON public.hand USING btree (sessionid, handstarttime);


--
-- TOC entry 3268 (class 1259 OID 18219)
-- Name: idx_handaction_hand_seq; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_handaction_hand_seq ON public.handaction USING btree (handid, seq);


--
-- TOC entry 3269 (class 1259 OID 18217)
-- Name: idx_handaction_hand_street; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_handaction_hand_street ON public.handaction USING btree (handid, street, seq);


--
-- TOC entry 3270 (class 1259 OID 18218)
-- Name: idx_handaction_player; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_handaction_player ON public.handaction USING btree (playerid);


--
-- TOC entry 3257 (class 1259 OID 18212)
-- Name: idx_handplayer_hand_player; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_handplayer_hand_player ON public.handplayer USING btree (handid, playerid);


--
-- TOC entry 3274 (class 1259 OID 18221)
-- Name: idx_handpot_hand_run; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_handpot_hand_run ON public.handpot USING btree (handid, runno);


--
-- TOC entry 3277 (class 1259 OID 18222)
-- Name: idx_handpotallocation_winner; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_handpotallocation_winner ON public.handpotallocation USING btree (winnerplayerid);


--
-- TOC entry 3221 (class 1259 OID 18202)
-- Name: idx_player_org; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_player_org ON public.player USING btree (orgid);


--
-- TOC entry 3284 (class 1259 OID 18226)
-- Name: idx_playerstatdaily_player_day; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_playerstatdaily_player_day ON public.playerstatdaily USING btree (playerid, day);


--
-- TOC entry 3280 (class 1259 OID 18224)
-- Name: idx_playerstatistic_player_period; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_playerstatistic_player_period ON public.playerstatistic USING btree (playerid, timeperiod, startdate, enddate);


--
-- TOC entry 3237 (class 1259 OID 18205)
-- Name: idx_seating_session_active; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_seating_session_active ON public.seating USING btree (sessionid, isactive);


--
-- TOC entry 3212 (class 1259 OID 18201)
-- Name: idx_user_org_active; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE INDEX idx_user_org_active ON public."user" USING btree (orgid, verified);


--
-- TOC entry 3287 (class 1259 OID 18225)
-- Name: playerstatdaily_playerid_day_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX playerstatdaily_playerid_day_idx ON public.playerstatdaily USING btree (playerid, day);


--
-- TOC entry 3283 (class 1259 OID 18223)
-- Name: playerstatistic_playerid_sessionid_timeperiod_startdate_end_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX playerstatistic_playerid_sessionid_timeperiod_startdate_end_idx ON public.playerstatistic USING btree (playerid, sessionid, timeperiod, startdate, enddate);


--
-- TOC entry 3240 (class 1259 OID 18204)
-- Name: seating_sessionid_seatno_leavetime_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX seating_sessionid_seatno_leavetime_idx ON public.seating USING btree (sessionid, seatno, leavetime);


--
-- TOC entry 3245 (class 1259 OID 18206)
-- Name: tournamententry_tournamentid_playerid_reentryno_idx; Type: INDEX; Schema: public; Owner: chris0527
--

CREATE UNIQUE INDEX tournamententry_tournamentid_playerid_reentryno_idx ON public.tournamententry USING btree (tournamentid, playerid, reentryno);


--
-- TOC entry 3347 (class 2620 OID 18445)
-- Name: blindstructure trigger_blindstructure_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_blindstructure_updatetime BEFORE UPDATE ON public.blindstructure FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3352 (class 2620 OID 18475)
-- Name: handaction trigger_check_hand_action_sequence; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_check_hand_action_sequence BEFORE INSERT OR UPDATE ON public.handaction FOR EACH ROW EXECUTE FUNCTION public.check_hand_action_sequence();


--
-- TOC entry 3351 (class 2620 OID 18449)
-- Name: communitycard trigger_communitycard_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_communitycard_updatetime BEFORE UPDATE ON public.communitycard FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3339 (class 2620 OID 18437)
-- Name: currency trigger_currency_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_currency_updatetime BEFORE UPDATE ON public.currency FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3340 (class 2620 OID 18438)
-- Name: fxrate trigger_fxrate_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_fxrate_updatetime BEFORE UPDATE ON public.fxrate FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3341 (class 2620 OID 18439)
-- Name: gametype trigger_gametype_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_gametype_updatetime BEFORE UPDATE ON public.gametype FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3348 (class 2620 OID 18446)
-- Name: hand trigger_hand_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_hand_updatetime BEFORE UPDATE ON public.hand FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3353 (class 2620 OID 18450)
-- Name: handaction trigger_handaction_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_handaction_updatetime BEFORE UPDATE ON public.handaction FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3359 (class 2620 OID 18456)
-- Name: handcategory trigger_handcategory_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_handcategory_updatetime BEFORE UPDATE ON public.handcategory FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3349 (class 2620 OID 18447)
-- Name: handplayer trigger_handplayer_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_handplayer_updatetime BEFORE UPDATE ON public.handplayer FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3350 (class 2620 OID 18448)
-- Name: handplayercard trigger_handplayercard_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_handplayercard_updatetime BEFORE UPDATE ON public.handplayercard FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3354 (class 2620 OID 18451)
-- Name: handpot trigger_handpot_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_handpot_updatetime BEFORE UPDATE ON public.handpot FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3355 (class 2620 OID 18452)
-- Name: handpotallocation trigger_handpotallocation_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_handpotallocation_updatetime BEFORE UPDATE ON public.handpotallocation FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3356 (class 2620 OID 18453)
-- Name: handrake trigger_handrake_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_handrake_updatetime BEFORE UPDATE ON public.handrake FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3360 (class 2620 OID 18457)
-- Name: importsource trigger_importsource_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_importsource_updatetime BEFORE UPDATE ON public.importsource FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3336 (class 2620 OID 18433)
-- Name: org trigger_org_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_org_updatetime BEFORE UPDATE ON public.org FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3338 (class 2620 OID 18436)
-- Name: player trigger_player_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_player_updatetime BEFORE UPDATE ON public.player FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3358 (class 2620 OID 18455)
-- Name: playerstatdaily trigger_playerstatdaily_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_playerstatdaily_updatetime BEFORE UPDATE ON public.playerstatdaily FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3357 (class 2620 OID 18454)
-- Name: playerstatistic trigger_playerstatistic_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_playerstatistic_updatetime BEFORE UPDATE ON public.playerstatistic FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3342 (class 2620 OID 18440)
-- Name: session trigger_pokertable_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_pokertable_updatetime BEFORE UPDATE ON public.session FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3361 (class 2620 OID 18458)
-- Name: rawhandhistory trigger_rawhandhistory_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_rawhandhistory_updatetime BEFORE UPDATE ON public.rawhandhistory FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3344 (class 2620 OID 18442)
-- Name: seating trigger_seating_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_seating_updatetime BEFORE UPDATE ON public.seating FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3343 (class 2620 OID 18441)
-- Name: sessiontable trigger_tablesession_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_tablesession_updatetime BEFORE UPDATE ON public.sessiontable FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3345 (class 2620 OID 18443)
-- Name: tournament trigger_tournament_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_tournament_updatetime BEFORE UPDATE ON public.tournament FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3346 (class 2620 OID 18444)
-- Name: tournamententry trigger_tournamententry_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_tournamententry_updatetime BEFORE UPDATE ON public.tournamententry FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3337 (class 2620 OID 18434)
-- Name: user trigger_user_updatetime; Type: TRIGGER; Schema: public; Owner: chris0527
--

CREATE TRIGGER trigger_user_updatetime BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.update_updatetime_column();


--
-- TOC entry 3334 (class 2606 OID 18422)
-- Name: auditlog auditlog_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.auditlog
    ADD CONSTRAINT auditlog_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id);


--
-- TOC entry 3335 (class 2606 OID 18417)
-- Name: auditlog auditlog_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.auditlog
    ADD CONSTRAINT auditlog_userid_fkey FOREIGN KEY (userid) REFERENCES public."user"(id);


--
-- TOC entry 3312 (class 2606 OID 18307)
-- Name: blindstructure blindstructure_sessionid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.blindstructure
    ADD CONSTRAINT blindstructure_sessionid_fkey FOREIGN KEY (sessionid) REFERENCES public.sessiontable(id);


--
-- TOC entry 3313 (class 2606 OID 18312)
-- Name: blindstructure blindstructure_tournamentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.blindstructure
    ADD CONSTRAINT blindstructure_tournamentid_fkey FOREIGN KEY (tournamentid) REFERENCES public.tournament(id);


--
-- TOC entry 3319 (class 2606 OID 18342)
-- Name: communitycard communitycard_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.communitycard
    ADD CONSTRAINT communitycard_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id) ON DELETE CASCADE;


--
-- TOC entry 3300 (class 2606 OID 18247)
-- Name: fxrate fxrate_basecurrency_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.fxrate
    ADD CONSTRAINT fxrate_basecurrency_fkey FOREIGN KEY (basecurrency) REFERENCES public.currency(code);


--
-- TOC entry 3301 (class 2606 OID 18252)
-- Name: fxrate fxrate_quotecurrency_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.fxrate
    ADD CONSTRAINT fxrate_quotecurrency_fkey FOREIGN KEY (quotecurrency) REFERENCES public.currency(code);


--
-- TOC entry 3314 (class 2606 OID 18317)
-- Name: hand hand_sessionid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.hand
    ADD CONSTRAINT hand_sessionid_fkey FOREIGN KEY (sessionid) REFERENCES public.sessiontable(id);


--
-- TOC entry 3320 (class 2606 OID 18347)
-- Name: handaction handaction_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handaction
    ADD CONSTRAINT handaction_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id) ON DELETE CASCADE;


--
-- TOC entry 3321 (class 2606 OID 18352)
-- Name: handaction handaction_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handaction
    ADD CONSTRAINT handaction_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id);


--
-- TOC entry 3330 (class 2606 OID 18397)
-- Name: handcategory handcategory_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handcategory
    ADD CONSTRAINT handcategory_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id) ON DELETE CASCADE;


--
-- TOC entry 3315 (class 2606 OID 18322)
-- Name: handplayer handplayer_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayer
    ADD CONSTRAINT handplayer_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id) ON DELETE CASCADE;


--
-- TOC entry 3316 (class 2606 OID 18327)
-- Name: handplayer handplayer_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayer
    ADD CONSTRAINT handplayer_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id);


--
-- TOC entry 3317 (class 2606 OID 18332)
-- Name: handplayercard handplayercard_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayercard
    ADD CONSTRAINT handplayercard_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id) ON DELETE CASCADE;


--
-- TOC entry 3318 (class 2606 OID 18337)
-- Name: handplayercard handplayercard_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handplayercard
    ADD CONSTRAINT handplayercard_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id);


--
-- TOC entry 3322 (class 2606 OID 18357)
-- Name: handpot handpot_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handpot
    ADD CONSTRAINT handpot_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id) ON DELETE CASCADE;


--
-- TOC entry 3323 (class 2606 OID 18362)
-- Name: handpotallocation handpotallocation_handpotid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handpotallocation
    ADD CONSTRAINT handpotallocation_handpotid_fkey FOREIGN KEY (handpotid) REFERENCES public.handpot(id) ON DELETE CASCADE;


--
-- TOC entry 3324 (class 2606 OID 18367)
-- Name: handpotallocation handpotallocation_winnerplayerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handpotallocation
    ADD CONSTRAINT handpotallocation_winnerplayerid_fkey FOREIGN KEY (winnerplayerid) REFERENCES public.player(id);


--
-- TOC entry 3325 (class 2606 OID 18377)
-- Name: handrake handrake_currency_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handrake
    ADD CONSTRAINT handrake_currency_fkey FOREIGN KEY (currency) REFERENCES public.currency(code);


--
-- TOC entry 3326 (class 2606 OID 18372)
-- Name: handrake handrake_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.handrake
    ADD CONSTRAINT handrake_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id) ON DELETE CASCADE;


--
-- TOC entry 3331 (class 2606 OID 18402)
-- Name: importsource importsource_orgid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.importsource
    ADD CONSTRAINT importsource_orgid_fkey FOREIGN KEY (orgid) REFERENCES public.org(id);


--
-- TOC entry 3298 (class 2606 OID 18237)
-- Name: player player_orgid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_orgid_fkey FOREIGN KEY (orgid) REFERENCES public.org(id);


--
-- TOC entry 3299 (class 2606 OID 18242)
-- Name: player player_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_userid_fkey FOREIGN KEY (userid) REFERENCES public."user"(id);


--
-- TOC entry 3329 (class 2606 OID 18392)
-- Name: playerstatdaily playerstatdaily_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.playerstatdaily
    ADD CONSTRAINT playerstatdaily_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id) ON DELETE CASCADE;


--
-- TOC entry 3327 (class 2606 OID 18382)
-- Name: playerstatistic playerstatistic_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.playerstatistic
    ADD CONSTRAINT playerstatistic_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id) ON DELETE CASCADE;


--
-- TOC entry 3328 (class 2606 OID 18387)
-- Name: playerstatistic playerstatistic_sessionid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.playerstatistic
    ADD CONSTRAINT playerstatistic_sessionid_fkey FOREIGN KEY (sessionid) REFERENCES public.sessiontable(id);


--
-- TOC entry 3302 (class 2606 OID 18262)
-- Name: session pokertable_currency_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT pokertable_currency_fkey FOREIGN KEY (currency) REFERENCES public.currency(code);


--
-- TOC entry 3303 (class 2606 OID 18257)
-- Name: session pokertable_orgid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT pokertable_orgid_fkey FOREIGN KEY (orgid) REFERENCES public.org(id);


--
-- TOC entry 3332 (class 2606 OID 18412)
-- Name: rawhandhistory rawhandhistory_handid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.rawhandhistory
    ADD CONSTRAINT rawhandhistory_handid_fkey FOREIGN KEY (handid) REFERENCES public.hand(id);


--
-- TOC entry 3333 (class 2606 OID 18407)
-- Name: rawhandhistory rawhandhistory_sourceid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.rawhandhistory
    ADD CONSTRAINT rawhandhistory_sourceid_fkey FOREIGN KEY (sourceid) REFERENCES public.importsource(id);


--
-- TOC entry 3307 (class 2606 OID 18287)
-- Name: seating seating_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.seating
    ADD CONSTRAINT seating_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id);


--
-- TOC entry 3308 (class 2606 OID 18282)
-- Name: seating seating_sessionid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.seating
    ADD CONSTRAINT seating_sessionid_fkey FOREIGN KEY (sessionid) REFERENCES public.sessiontable(id);


--
-- TOC entry 3304 (class 2606 OID 18277)
-- Name: sessiontable tablesession_closedby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.sessiontable
    ADD CONSTRAINT tablesession_closedby_fkey FOREIGN KEY (closedby) REFERENCES public."user"(id);


--
-- TOC entry 3305 (class 2606 OID 18272)
-- Name: sessiontable tablesession_openedby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.sessiontable
    ADD CONSTRAINT tablesession_openedby_fkey FOREIGN KEY (openedby) REFERENCES public."user"(id);


--
-- TOC entry 3306 (class 2606 OID 18267)
-- Name: sessiontable tablesession_tableid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.sessiontable
    ADD CONSTRAINT tablesession_tableid_fkey FOREIGN KEY (sessionid) REFERENCES public.session(id);


--
-- TOC entry 3297 (class 2606 OID 18427)
-- Name: token token_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.token
    ADD CONSTRAINT token_userid_fkey FOREIGN KEY (userid) REFERENCES public."user"(id);


--
-- TOC entry 3309 (class 2606 OID 18292)
-- Name: tournament tournament_orgid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.tournament
    ADD CONSTRAINT tournament_orgid_fkey FOREIGN KEY (orgid) REFERENCES public.org(id);


--
-- TOC entry 3310 (class 2606 OID 18302)
-- Name: tournamententry tournamententry_playerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.tournamententry
    ADD CONSTRAINT tournamententry_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(id);


--
-- TOC entry 3311 (class 2606 OID 18297)
-- Name: tournamententry tournamententry_tournamentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public.tournamententry
    ADD CONSTRAINT tournamententry_tournamentid_fkey FOREIGN KEY (tournamentid) REFERENCES public.tournament(id);


--
-- TOC entry 3296 (class 2606 OID 18227)
-- Name: user user_orgid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: chris0527
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_orgid_fkey FOREIGN KEY (orgid) REFERENCES public.org(id);


--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: chris0527
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2025-09-09 21:01:54

--
-- PostgreSQL database dump complete
--

