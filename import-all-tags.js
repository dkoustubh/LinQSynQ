// Script to import all PLC_To_WMS tags into tags-opcua.json
const fs = require('fs');

// All tag names from your PLC Data Block
const tagNames = [
    "STKR1_Heart Bit", "STKR1_Healthy", "STKR1_Data Request", "STKR1_Pick-up Position Pallet Present",
    "STKR1_Unloading Position Pallet Present", "STKR1_INSIDE_TANK_PALLET_PRESENT", "Yokogawa_Connection_Healthy",
    "STKR1_Spare_Bool2", "STKR1_Spare_Bool3", "STKR1_Spare_Bool4", "STKR1_Spare_Bool5", "STKR1_Spare_Bool6",
    "STKR1_Spare_Bool7", "STKR1_Spare_Bool8", "STKR1_Spare_Bool9", "STKR1_Spare_Bool10", "STKR1_Spare_Bool11",
    "STKR1_Spare_Bool12", "STKR1_Spare_Bool13", "STKR1_Spare_Bool14", "STKR1_Spare_Bool15", "STKR1_Spare_Bool16",
    "STKR1_Spare_Bool17", "STKR1_Spare_Bool18", "STKR1_Spare_Bool19", "STKR1_Spare_Bool20", "STKR1_Spare_Bool21",
    "STKR1_Spare_Bool22", "STKR1_Spare_Bool23", "STKR1_Spare_Bool24", "STKR1_Spare_Bool25", "STKR1_Spare_Bool26",
    "LOADING_STATION_PALLET_PRESENT (CH-01)", "LOADING_STATION_WORK_DONE", "Infeed All Conv Empty",
    "Loading Station Trolley Door Close", "Infeed Position Pallet Present", "UNLOADING_STATION_PALLET_PRESENT",
    "UNLOADING_STATION_WORK_DONE", "Outfeed All Conv Empty", "UNLOADING_STATION_TROLLEY_UNLOADED_SIGNAL",
    "SPARE_5", "Cage Ready To Return From OutFeed Conv", "SPARE_6", "SPARE_7", "SPARE_8", "SPARE_9", "SPARE_10",
    "SPARE_11", "SPARE_12",
    ...Array.from({ length: 78 }, (_, i) => `BOOL_0${String(i + 50).padStart(2, '0')}`),
    "SPARE_13",
    ...Array.from({ length: 127 }, (_, i) => `BYTE_${String(i + 1).padStart(3, '0')}`),
    "STKR1_Control mode", "STKR1_Current column", "STKR1_Current line(Bay)", "STKR1_Task completion",
    "STKR1_DEPTH(DIP)", "STKR1_FBK_START_COLUMN", "STKR1_FBK_START_FLOOR", "STKR1_FBK_START_LINE",
    "STKR1_FBK_START_POSITION_NUMBER_IN_RACK(DIP)", "STKR1_FBK_TARGET_COLUMN", "STKR1_FBK_TARGET_FLOOR(LEVEL)",
    "STKR1_FBK_TARGET_LINE(BAY)", "STKR1_FBK_TARGET_POSITION_NUMBER_IN_RACK(DIP)", "STKR1_FBK_TASK_NO",
    "STKR1_FBK_TASK_TYPE", "STKR1_Spare_Int1", "STKR1_Spare_Int2", "STKR1_Spare_Int3", "STKR1_Spare_Int4",
    "STKR1_Spare_Int5", "FBK_Mission_ID_1",
    ...Array.from({ length: 19 }, (_, i) => `SPARE_${i + 15}`),
    "Trolley Height",
    ...Array.from({ length: 87 }, (_, i) => `INT_${String(i + 41).padStart(3, '0')}`),
    ...Array.from({ length: 128 }, (_, i) => `WORD_${String(i).padStart(3, '0')}`),
    "STKR1_TRAVEL_POSITION", "STKR1_Spare_DINT1", "STKR1_Spare_DINT2", "SPARE_34", "SPARE_35", "SPARE_36",
    "FBK_Mission_ID", "DIP", "START_COLUMN", "START_FLOOR", "START_LINE", "START_DIP", "TARGET_COLUMN",
    "TARGET_FLOOR", "TARGET_LINE", "TARGET_DIP", "MISSION_ID", "TASK_NO", "TASK_TYPE",
    ...Array.from({ length: 109 }, (_, i) => `DINT_${String(i + 19).padStart(3, '0')}`),
    ...Array.from({ length: 128 }, (_, i) => `REAL_${String(i).padStart(3, '0')}`),
    "SPARE_46", "AREA_1_PICKUP_POSITION_PALLET_CODE (RO-23)", "SPARE_37",
    "AREA_1_UNLOADING_POSITION_PALLET_CODE(SPARE) (RO-108)", "SPARE_38", "SPARE_39", "SPARE_40", "SPARE_41",
    "SPARE_42", "SPARE_43", "SPARE_44", "LOADING_STATION_MATERIAL_CODE (CH-01)",
    "AREA_1_STACKER_1_PICK_UP_POSITION_PALLET_CODE", "SPARE_48", "SPARE_47", "SPARE_51", "SPARE_50", "SPARE_49", "SPARE_45"
];

// Generate tags object
const tags = {};
tagNames.forEach(tagName => {
    // Create safe key name (remove spaces and special chars)
    const safeKey = tagName
        .replace(/\s+/g, '_')
        .replace(/[()/-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    // OPC UA Node ID
    tags[safeKey] = `ns=3;s="PLC_To_WMS"."${tagName}"`;
});

// Write to file
fs.writeFileSync('tags-opcua.json', JSON.stringify(tags, null, 2));
console.log(`✅ Generated ${Object.keys(tags).length} tags successfully!`);
console.log('📄 Saved to: tags-opcua.json');
