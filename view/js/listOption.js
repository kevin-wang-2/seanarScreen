const {EventEmitter} = require("events");

class ListOption {
    constructor(obj) {
        this.jqobj = $(obj);
        let that = this;

        this.events = new EventEmitter();
        this.value = 0;

        this.disabled = false;

        this.jqobj.find(".option").on("click", function() {
            if(!this.disabled) {
                $(obj).find(".option").removeClass("active");
                $(this).addClass("active");
                that.value = parseInt($(this).attr("value"));
                that.events.emit("change");
            }
        });
    }

    val(a) {
        if(typeof a === "number") {
            this.jqobj.find(".option").removeClass("active");
            this.jqobj.find(".option[value='" + a + "']").addClass("active");
            this.value = a;
        } else {
            return this.value;
        }
    }

    disable() {
        this.disabled = true;
        this.jqobj.addClass("disable")
    }
}
module.exports = ListOption;