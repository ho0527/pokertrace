document.addEventListener("DOMContentLoaded", function () {
    var backButton = document.querySelector("[data-error-back]");
    if (!backButton) return;
    backButton.addEventListener("click", function () {
        if (history.length > 1) {
            history.back();
        } else {
            location.href = "/frontend/";
        }
    });
});
