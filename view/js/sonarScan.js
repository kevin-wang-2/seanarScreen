/**
 * ���ɶ�Ӧɨ����������deltaX, deltaYֵ
 * @param cnt: ɨ��������
 * @returns {{deltaX: Array, deltaY: Array}}
 */
function generateDelta(cnt = 7200) {
    let deltaX = [], deltaY = [];
    let Q = -90, dQ = 360 / cnt;
    for(let i = 0; i < cnt; i++) {
        deltaX[i] = Math.cos(Q * Math.PI / 180);
        deltaY[i] = Math.sin(Q * Math.PI / 180);
        Q += dQ;
    }

    return {
        deltaX: deltaX,
        deltaY: deltaY
    }
}

exports.generateDelta = generateDelta;

/**
 * �������������ŵ���ʾ�뾶�Ա���ʾ
 * @param src: Դ����
 * @param sourceLength: Դ���ݵ���
 * @param targetLength: Ŀ��뾶
 */
function scaleData(src, sourceLength, targetLength) {
    let step = sourceLength / targetLength,
        ret = [];

    if(step > 1) {
        for(let i = 0; i < targetLength; i++) {
            let num = Math.floor(step + 0.5) - 1;

            let data = src[Math.floor(i * step + 0.5)];
            while(num > 0) {
                let data1 = src[Math.floor(i * step + 0.5) + num];
                if(data < data1) data = data1;
                num--;
            }

            ret[i] = data;
        }
    } else {
        for(let i = 0; i < targetLength; i++) {
            ret[i] = src[Math.floor(i * step)];
        }
    }

    return ret;
}

exports.scaleData = scaleData;