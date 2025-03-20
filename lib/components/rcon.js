"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rcon = void 0;
const stream_1 = require("stream");
const MsgPacker_1 = require("../MsgPacker");
const MsgUnpacker_1 = require("../MsgUnpacker");
class Rcon extends stream_1.EventEmitter {
    on(event, listener) {
        return super.on(event, listener);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    constructor(_client) {
        super();
        this.CommandList = [];
        this._client = _client;
    }
    // SendMsgEx: (Msgs: MsgPacker[] | MsgPacker) => void;
    send(packer) {
        var _a;
        if (!((_a = this._client.options) === null || _a === void 0 ? void 0 : _a.lightweight))
            this._client.QueueChunkEx(packer);
        else
            this._client.SendMsgEx(packer);
    }
    /** Rcon auth, set the `username` to empty string for authentication w/o username **/
    auth(usernameOrPassword, password) {
        const rconAuthMsg = new MsgPacker_1.MsgPacker(18 /* NETMSG.System.NETMSG_RCON_AUTH */, true, 1);
        if (password == undefined) {
            rconAuthMsg.AddString("");
            rconAuthMsg.AddString(usernameOrPassword);
        }
        else {
            rconAuthMsg.AddString(usernameOrPassword);
            rconAuthMsg.AddString(password);
        }
        rconAuthMsg.AddInt(1);
        this.send(rconAuthMsg);
    }
    /** Send rcon command **/
    rcon(cmds) {
        let _cmds;
        if (cmds instanceof Array)
            _cmds = cmds;
        else
            _cmds = [cmds];
        const msgs = [];
        _cmds.forEach((cmd) => {
            const rconCmdMsg = new MsgPacker_1.MsgPacker(17 /* NETMSG.System.NETMSG_RCON_CMD */, true, 1);
            rconCmdMsg.AddString(cmd);
            msgs.push(rconCmdMsg);
        });
        this.send(msgs);
    }
    /** This method is called by the Client to handle the chunks. It should not be called directly. */
    _checkChunks(chunk) {
        if (chunk.msgid == 11 /* NETMSG.System.NETMSG_RCON_LINE */) {
            const unpacker = new MsgUnpacker_1.MsgUnpacker(chunk.raw);
            const msg = unpacker.unpackString();
            this.emit('rcon_line', msg);
        }
        else if (chunk.msgid == 10 /* NETMSG.System.NETMSG_RCON_AUTH_STATUS */) {
            const unpacker = new MsgUnpacker_1.MsgUnpacker(chunk.raw);
            const AuthLevel = unpacker.unpackInt();
            const ReceiveCommands = unpacker.unpackInt();
            this.emit('rcon_auth_status', { AuthLevel, ReceiveCommands });
        }
        else if (chunk.msgid == 25 /* NETMSG.System.NETMSG_RCON_CMD_ADD */) {
            const unpacker = new MsgUnpacker_1.MsgUnpacker(chunk.raw);
            const command = unpacker.unpackString();
            const description = unpacker.unpackString();
            const params = unpacker.unpackString();
            this.CommandList.push({ command, description, params });
            this.emit('rcon_cmd_add', { command, description, params });
        }
        else if (chunk.msgid == 26 /* NETMSG.System.NETMSG_RCON_CMD_REM */) {
            const unpacker = new MsgUnpacker_1.MsgUnpacker(chunk.raw);
            const command = unpacker.unpackString();
            this.emit('rcon_cmd_rem', { command });
            let index = this.CommandList.findIndex(a => a.command == command);
            if (index - 1 >= 0)
                this.CommandList.splice(index, 1);
        }
        else {
            return false;
        }
        return true;
    }
}
exports.Rcon = Rcon;
