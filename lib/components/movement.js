"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
class Movement {
    constructor() {
        this.input = { m_Direction: 0, m_Fire: 0, m_Hook: 0, m_Jump: 0, m_NextWeapon: 0, m_PlayerFlags: 1, m_PrevWeapon: 0, m_TargetX: 0, m_TargetY: 0, m_WantedWeapon: 1 };
    }
    RunLeft() {
        this.input.m_Direction = -1;
    }
    RunRight() {
        this.input.m_Direction = 1;
    }
    RunStop() {
        this.input.m_Direction = 0;
    }
    Jump(state = true) {
        this.input.m_Jump = state ? 1 : 0;
    }
    Fire() {
        this.input.m_Fire++;
    }
    Hook(state = true) {
        this.input.m_Hook = state ? 1 : 0;
    }
    NextWeapon() {
        this.input.m_NextWeapon = 1;
        this.WantedWeapon(0);
    }
    PrevWeapon() {
        this.input.m_PrevWeapon = 1;
        this.WantedWeapon(0);
    }
    WantedWeapon(weapon) {
        this.input.m_WantedWeapon = weapon;
    }
    SetAim(x, y) {
        this.input.m_TargetX = x;
        this.input.m_TargetY = y;
    }
    Flag(toggle, num) {
        if (toggle) {
            this.input.m_PlayerFlags |= num;
        }
        else {
            this.input.m_PlayerFlags &= ~num;
        }
    }
    FlagPlaying(toggle = true) {
        this.Flag(toggle, 1);
    }
    FlagInMenu(toggle = true) {
        this.Flag(toggle, 2);
    }
    FlagChatting(toggle = true) {
        this.Flag(toggle, 4);
    }
    FlagScoreboard(toggle = true) {
        this.Flag(toggle, 8);
    }
    FlagHookline(toggle = true) {
        this.Flag(toggle, 16);
    }
    Reset() {
        this.input.m_Direction = 0;
        this.input.m_Jump = 0;
        this.input.m_Fire = 0;
        this.input.m_Hook = 0;
        this.input.m_PlayerFlags = 0;
        this.input.m_NextWeapon = 0;
        this.input.m_PrevWeapon = 0;
    }
}
exports.default = Movement;
