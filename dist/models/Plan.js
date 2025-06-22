"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const planSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    cashfreePlanId: {
        type: String,
        required: true,
        unique: true, // create a unique index on the new field
        index: true,
    },
    price: {
        type: Number,
        required: true,
    },
    durationMonths: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Plan", planSchema);
