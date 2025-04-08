import mongoose from "mongoose";
const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: { type: Date, required: true },
});

//Auto-delete expire token
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Blacklisted", blacklistedTokenSchema);
