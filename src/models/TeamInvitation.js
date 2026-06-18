const mongoose = require('mongoose');

const teamInvitationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    invitedEmail: { type: String, trim: true, lowercase: true },
    role: String,
    token: { type: String, unique: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: Date,
    isAccepted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

teamInvitationSchema.index({ organizationId: 1 });
teamInvitationSchema.index({ invitedEmail: 1 });
teamInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
teamInvitationSchema.index({ isAccepted: 1 });

module.exports = mongoose.model('TeamInvitation', teamInvitationSchema);
