// cast.js — one look per character, identical in every shot.
// DOC: white coat over light-blue scrubs, messy (spiky) hair; stethoscope + ID badge are added by drawDoc().
export const DOC = { top: 'labcoat', legs: '#8ec9f0', head: 'curly' };
// NURSE: dark-blue scrubs, hair tied back, blue nitrile gloves.
export const NURSE = { top: 'tshirt', color: '#2f62b0', legs: '#264f8f', head: 'ponytail', headColor: '#2f62b0', gloves: '#8fd3ff' };
// PATIENT: pale hospital gown, cartoon head bandage (blood stains added by drawPatient()).
export const PATIENT = { top: 'tshirt', color: '#b9c4d4', legs: '#a7b3c4', head: 'headband', headColor: '#f2efe8' };
// background staff: plain ink (no colour item), gloves only
export const STAFF = { top: 'none', gloves: '#8fd3ff' };
export const MEDIC = { top: 'none', head: 'cap', headColor: '#2a2f3c' };
// signature colours used by graphics
export const COL = { doc: '#8ec9f0', nurse: '#2f62b0', blood: '#c8283a', bloodDark: '#8e1424', ecg: '#59f08a', alarm: '#ff3b4a', bot: '#7fe0d0', botDeep: '#173a40', userBubble: '#3a7bd5' };
