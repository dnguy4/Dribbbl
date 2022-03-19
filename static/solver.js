
$("#dialog-confirm").hide();
function noHintProvided() {
    $("#dialog-text").text(`The author did not provide a hint.`)
    $("#dialog-confirm").dialog({
        title: "No hint",
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}

function hintProvided() {
    $("#solver_actual_hint").hide()
    $("#dialog-text").text(`Do you really want to see the hint?`)
    $("#dialog-confirm").dialog({
        title: "Hint Confirmation",
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Yes": function () {
                $("#dialog-text").text(``)
                $("#solver_actual_hint").show()
                $(this).dialog({
                    title: "Author's hint",
                    resizable: false,
                    height: "auto",
                    width: 400,
                    modal: true,
                    buttons: {
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }
                });
            },
            "No": function () {
                $(this).dialog("close");
            }
        }
    });
}