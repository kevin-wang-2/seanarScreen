let fs = require("fs");

/**
 * SonarFile �ļ���ʽ
 * typedef struct    // Model HFIS Switch Data Command To Sonar Head
 {
	unsigned char ucFlag;			// 0xFE
	unsigned char ucSize;			// Size of RECORDFORMAT
	unsigned char ucVersion;		// Version of RECORDFORMAT
	unsigned char ucParam; 			// Bit3:0 - ���࣬1 ~ 15, Bit6:Sector

	DWORD tm;						// Year:6 Day:5 Hour:5 Mon:4 Min:6 Sec:6,��ѭ��������0xFE

	unsigned char ucAngleLo;		//
	unsigned char ucAngleHi;		// ((ucAngleHi&0x7f)<<7)+(ucAngleLo&0x7f)
	unsigned char ucDataLenLo;		//
	unsigned char ucDataLenHi;		// ((ucDataLenHi&0x7f)<<7)+(ucDataLenLo&0x7f)

	unsigned char ucFreq;			// Frequency
	unsigned char ucRange; 			// 1 to 200m
	unsigned char ucGain; 			// 0 - 40dB
	unsigned char ucRes1; 			// 0

	unsigned char ucMaxStepLo; 		//
	unsigned char ucMaxStepHi; 		// ((ucMaxStepHi&0x7f)<<7)+(ucMaxStepLo&0x7f)
	unsigned char ucRes2; 			// 0
	unsigned char ucEnd;			// Termination, 0xFD
} RECORDFORMAT;
 */

class SonarFile {
    constructor() {
        this.openForRead = false;
        this.openForWrite = false;
    }

    /**
     * ��һ�������ļ�
     * @param path: �����ļ���·��
     * @param flags: ģʽ
     */
    open(path, flags) {
        this.fd = fs.openSync(path, flags);
        if (!this.fd) throw Error("�ļ���ʧ��");
        if (flags === "r")
            this.openForRead = true;
        else
            this.openForWrite = true;
    }

    /**
     * ��ȡһ֡��У�������
     */
    read() {
        // ����ʹ��Buffer����������, һ����18�ֽ�����
        let headBuf = Buffer.alloc(20),
            success = fs.readSync(this.fd, headBuf, 0, 20, null);

        // EOF
        if (success !== 20) return false;

        let headBufferArray = headBuf.toJSON().data;
        let m_SonarRecord = {
            ucFlag: headBufferArray[0],
            ucSize: headBufferArray[1],
            ucVersion: headBufferArray[2],
            ucParam: headBufferArray[3],

            time: headBufferArray[4] << 64 | headBufferArray[5] << 32 | headBufferArray[6] << 16 | headBufferArray[7],

            ucAngleLo: headBufferArray[8],
            ucAngleHi: headBufferArray[9],
            ucDataLenLo: headBufferArray[10],
            ucDataLenHi: headBufferArray[11],

            ucFreq: headBufferArray[12],
            ucRange: headBufferArray[13],
            ucGain: headBufferArray[14],
            ucResl: headBufferArray[15],

            ucMaxStepLo: headBufferArray[16],
            ucMaxStepHi: headBufferArray[17],
            ucRes2: headBufferArray[18],
            ucEnd: headBufferArray[19]
        };


        if (m_SonarRecord.ucFlag === 0xfe) {
            let len = (((m_SonarRecord.ucDataLenHi & 0x7f) << 7) | (m_SonarRecord.ucDataLenLo & 0x7f));

            if(len > 2000) throw Error("Frame length exceeded");

            let buf = Buffer.alloc(len + 2);
            fs.readSync(this.fd, buf, 0, len + 2, null);

            let curAngle = (((m_SonarRecord.ucAngleHi & 0x7f) << 7) | (m_SonarRecord.ucAngleLo & 0x7f));
            m_SonarRecord.m_nAngle = curAngle;
            if (curAngle < 0 || curAngle >= 800) throw Error("Data invalid");

            return {
                header: m_SonarRecord,
                data: buf.toJSON().data,
                length: len
            }
        } else { // �Ƿ��ļ�
            throw Error("Head data invalid")
        }
    }

    close() {
        fs.closeSync(this.fd);
    }
}

module.exports = SonarFile;
