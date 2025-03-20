"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotWrapper = void 0;
const stream_1 = require("stream");
class SnapshotWrapper extends stream_1.EventEmitter {
    constructor(_client) {
        // this.SendMsgEx = callback;
        super();
        this._client = _client;
    }
    getParsed(type_id, id) {
        var _a;
        if (type_id == -1)
            return undefined;
        return (_a = this._client.rawSnapUnpacker.deltas.find(delta => delta.type_id == type_id && delta.id == id)) === null || _a === void 0 ? void 0 : _a.parsed;
    }
    getAll(type_id) {
        let _all = [];
        if (type_id == -1)
            return _all;
        this._client.rawSnapUnpacker.deltas.forEach(delta => {
            if (delta.type_id == type_id)
                _all.push(delta.parsed);
        });
        return _all;
        // return this._client.rawSnapUnpacker.deltas.filter(delta => delta.type_id == type_id && delta.id == id).map(a => a.parsed);
    }
    getObjPlayerInput(player_id) {
        return this.getParsed(1 /* SnapshotItemIDs.OBJ_PLAYER_INPUT */, player_id);
    }
    get AllObjPlayerInput() {
        return this.getAll(1 /* SnapshotItemIDs.OBJ_PLAYER_INPUT */);
    }
    getObjProjectile(id) {
        return this.getParsed(2 /* SnapshotItemIDs.OBJ_PROJECTILE */, id);
    }
    get AllProjectiles() {
        return this.getAll(2 /* SnapshotItemIDs.OBJ_PROJECTILE */);
    }
    getObjLaser(id) {
        return this.getParsed(3 /* SnapshotItemIDs.OBJ_LASER */, id);
    }
    get AllObjLaser() {
        return this.getAll(3 /* SnapshotItemIDs.OBJ_LASER */);
    }
    getObjPickup(id) {
        return this.getParsed(4 /* SnapshotItemIDs.OBJ_PICKUP */, id);
    }
    get AllObjPickup() {
        return this.getAll(4 /* SnapshotItemIDs.OBJ_PICKUP */);
    }
    getObjFlag(id) {
        return this.getParsed(5 /* SnapshotItemIDs.OBJ_FLAG */, id);
    }
    get AllObjFlag() {
        return this.getAll(5 /* SnapshotItemIDs.OBJ_FLAG */);
    }
    getObjGameInfo(id) {
        return this.getParsed(6 /* SnapshotItemIDs.OBJ_GAME_INFO */, id);
    }
    get AllObjGameInfo() {
        return this.getAll(6 /* SnapshotItemIDs.OBJ_GAME_INFO */);
    }
    getObjGameData(id) {
        return this.getParsed(7 /* SnapshotItemIDs.OBJ_GAME_DATA */, id);
    }
    get AllObjGameData() {
        return this.getAll(7 /* SnapshotItemIDs.OBJ_GAME_DATA */);
    }
    /** NOTICE: x & y positions always differ from the positions in the ingame debug menu. If you want the debug menu positions, you can calculate them like this: Math.round((myChar.character_core.x / 32) * 100)/100 */
    getObjCharacterCore(player_id) {
        return this.getParsed(8 /* SnapshotItemIDs.OBJ_CHARACTER_CORE */, player_id);
    }
    /** NOTICE: x & y positions always differ from the positions in the ingame debug menu. If you want the debug menu positions, you can calculate them like this: Math.round((myChar.character_core.x / 32) * 100)/100 */
    get AllObjCharacterCore() {
        return this.getAll(8 /* SnapshotItemIDs.OBJ_CHARACTER_CORE */);
    }
    /** NOTICE: x & y positions always differ from the positions in the ingame debug menu. If you want the debug menu positions, you can calculate them like this: Math.round((myChar.character_core.x / 32) * 100)/100 */
    getObjCharacter(player_id) {
        return this.getParsed(9 /* SnapshotItemIDs.OBJ_CHARACTER */, player_id);
    }
    /** NOTICE: x & y positions always differ from the positions in the ingame debug menu. If you want the debug menu positions, you can calculate them like this: Math.round((myChar.character_core.x / 32) * 100)/100 */
    get AllObjCharacter() {
        return this.getAll(9 /* SnapshotItemIDs.OBJ_CHARACTER */);
    }
    getObjPlayerInfo(player_id) {
        return this.getParsed(10 /* SnapshotItemIDs.OBJ_PLAYER_INFO */, player_id);
    }
    get AllObjPlayerInfo() {
        return this.getAll(10 /* SnapshotItemIDs.OBJ_PLAYER_INFO */);
    }
    getObjClientInfo(player_id) {
        return this.getParsed(11 /* SnapshotItemIDs.OBJ_CLIENT_INFO */, player_id);
    }
    get AllObjClientInfo() {
        return this.getAll(11 /* SnapshotItemIDs.OBJ_CLIENT_INFO */);
    }
    getObjSpectatorInfo(player_id) {
        return this.getParsed(12 /* SnapshotItemIDs.OBJ_SPECTATOR_INFO */, player_id);
    }
    get AllObjSpectatorInfo() {
        return this.getAll(12 /* SnapshotItemIDs.OBJ_SPECTATOR_INFO */);
    }
    getTypeId(name) {
        var _a;
        return ((_a = this._client.rawSnapUnpacker.uuid_manager.LookupName(name)) === null || _a === void 0 ? void 0 : _a.type_id) || -1;
    }
    getObjExMyOwnObject(id) {
        return this.getParsed(this.getTypeId("my-own-object@heinrich5991.de"), id);
    }
    get AllObjExMyOwnObject() {
        return this.getAll(this.getTypeId("my-own-object@heinrich5991.de"));
    }
    getObjExDDNetCharacter(id) {
        return this.getParsed(this.getTypeId("character@netobj.ddnet.tw"), id);
    }
    get AllObjExDDNetCharacter() {
        return this.getAll(this.getTypeId("character@netobj.ddnet.tw"));
    }
    getObjExGameInfo(id) {
        return this.getParsed(this.getTypeId("gameinfo@netobj.ddnet.tw"), id);
    }
    get AllObjExGameInfo() {
        return this.getAll(this.getTypeId("gameinfo@netobj.ddnet.tw"));
    }
    getObjExDDNetProjectile(id) {
        return this.getParsed(this.getTypeId("projectile@netobj.ddnet.tw"), id);
    }
    get AllObjExDDNetProjectile() {
        return this.getAll(this.getTypeId("projectile@netobj.ddnet.tw"));
    }
    getObjExLaser(id) {
        return this.getParsed(this.getTypeId("laser@netobj.ddnet.tw"), id);
    }
    get AllObjExLaser() {
        return this.getAll(this.getTypeId("laser@netobj.ddnet.tw"));
    }
    get OwnID() {
        var _a;
        return (_a = this.AllObjPlayerInfo.find(parsed => parsed.local)) === null || _a === void 0 ? void 0 : _a.client_id;
    }
}
exports.SnapshotWrapper = SnapshotWrapper;
