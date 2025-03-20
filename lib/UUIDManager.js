"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUIDManager = exports.createTwMD5Hash = void 0;
const crypto_1 = require("crypto");
const createTwMD5Hash = (name) => {
    let hash = (0, crypto_1.createHash)("md5")
        .update(Buffer.from([0xe0, 0x5d, 0xda, 0xaa, 0xc4, 0xe6, 0x4c, 0xfb, 0xb6, 0x42, 0x5d, 0x48, 0xe8, 0x0c, 0x00, 0x29]))
        .update(name)
        .digest();
    hash[6] &= 0x0f;
    hash[6] |= 0x30;
    hash[8] &= 0x3f;
    hash[8] |= 0x80;
    return hash;
};
exports.createTwMD5Hash = createTwMD5Hash;
// [{name: string, hash: Buffer}, ..]
class UUIDManager {
    constructor(pOffset = 65536, pSnapshot = false) {
        this.uuids = [];
        this.offset = pOffset;
        this.snapshot = pSnapshot;
    }
    LookupUUID(hash) {
        return this.uuids.find(a => a.hash.compare(hash) == 0);
    }
    LookupName(name) {
        return this.uuids.find(a => a.name === name);
    }
    LookupType(ID) {
        if (!this.snapshot) {
            return this.uuids[ID - this.offset];
        }
        else {
            return this.uuids.find(a => a.type_id == ID);
        }
    }
    RegisterName(name, type_id = this.offset - this.uuids.length) {
        this.uuids.push({
            name, hash: (0, exports.createTwMD5Hash)(name), type_id
        });
    }
}
exports.UUIDManager = UUIDManager;
