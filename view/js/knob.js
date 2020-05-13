let {EventEmitter} = require("events");

class Knob {
    constructor(obj, maxVal = 100, minVal = 0, gearList = [], unit = "") {
        this.jqObj = $(obj).find(".knob");
        this.obj = obj;
        let centerX = parseInt(this.jqObj.css("width")) / 2, centerY = parseInt(this.jqObj.css("height")) / 2;

        this.enabled = true;

        this.unit = unit;

        this.mouseDownFlag = false;
        this.value = 0;
        this.maxVal = maxVal;
        this.minVal = minVal;
        $(obj).find(".knob--label").html(this.value * (this.minVal - this.minVal) + this.minVal + unit);

        gearList.forEach((gear) => {
            let transAngle = (gear - minVal) / (maxVal - minVal) * 360;
            $("<span class='knob--gear'></span>").css({transform: "rotate(" + transAngle + "deg)"}).prependTo(this.jqObj);
        });

        this.events = new EventEmitter;

        $(obj).on("mousedown", () => {
            this.mouseDownFlag = true;
        });

        $(obj)[0].onmousemove = (ev) => {
            if ($(ev.target).css("transform") !== "none") return;
            if(this.mouseDownFlag && this.enabled) {
                let angle = Math.atan((ev.offsetY - centerY) / (ev.offsetX - centerX));
                if(ev.offsetX > centerX) {
                    this.jqObj.find(".knob--pointer").css({transform: "rotate(" + (180 + angle / Math.PI * 180) + "deg)"});
                    this.value = (180 + angle / Math.PI * 180) / 360;
                    if(this.value < 0) this.value += 1;
                    if(this.value === 1) this.value = 0;
                } else if(ev.offsetX < centerX) {
                    this.jqObj.find(".knob--pointer").css({transform: "rotate(" + (angle / Math.PI * 180) + "deg)"});
                    this.value = angle / Math.PI * 180 / 360;
                    if(this.value < 0) this.value += 1;
                    if(this.value === 1) this.value = 0;
                } else if(ev.offsetX === centerX && ev.offsetY < centerY) { // ��������
                    this.jqObj.find(".knob--pointer").css({transform: "rotate(90deg)"});
                    this.value = 0.25;
                } else {
                    this.jqObj.find(".knob--pointer").css({transform: "rotate(270deg)"});
                    this.value = 0.75;
                }
                $(obj).find(".knob--label").html(this.value * (this.minVal - this.minVal) + this.minVal + unit);
                this.events.emit("change");
            }
        };

        $(obj).on("mouseup", () => {
            this.mouseDownFlag = false;
        });

        $(document.body).on("mouseup", () => {
            this.mouseDownFlag = false;
        });

        $(obj).on("click", (ev) => {
            if ($(ev.target).css("transform") !== "none") return;
            if(!this.enabled) return;
            let angle = Math.atan((ev.offsetY - centerY) / (ev.offsetX - centerX));
            if(ev.offsetX > centerX) {
                this.jqObj.find(".knob--pointer").css({transform: "rotate(" + (180 + angle / Math.PI * 180) + "deg)"});
                this.value = (180 + angle / Math.PI * 180) / 360;
                if(this.value < 0) this.value += 1;
                if(this.value === 1) this.value = 0;
            } else if(ev.offsetX < centerX) {
                this.jqObj.find(".knob--pointer").css({transform: "rotate(" + (angle / Math.PI * 180) + "deg)"});
                this.value = angle / Math.PI * 180 / 360;
                if(this.value < 0) this.value += 1;
                if(this.value === 1) this.value = 0;
            } else if(ev.offsetX === centerX && ev.offsetY < centerY) { // ��������
                this.jqObj.find(".knob--pointer").css({transform: "rotate(90deg)"});
                this.value = 0.25;
            } else {
                this.jqObj.find(".knob--pointer").css({transform: "rotate(270deg)"});
                this.value = 0.75;
            }
            $(obj).find(".knob--label").html(this.value * (this.minVal - this.minVal) + this.minVal + unit);
            this.events.emit("change");
        });
    }

    val(a) {
        if(typeof a === "number") {
            this.value = (a - this.minVal) / (this.maxVal - this.minVal);
            this.jqObj.find(".knob--pointer").css({transform: "rotate(" + this.value * 360 + "deg)"});
            $(this.obj).find(".knob--label").html(a + this.unit);
        } else {
            return this.value * (this.maxVal - this.minVal) + this.minVal;
        }
    }

    disable() {
        this.enabled = false;
        $(this.obj).addClass("disable");
    }
}

module.exports = Knob;