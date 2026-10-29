const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a student name'],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Please add a roll number'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      trim: true,
    },
    hostelBlock: {
      type: String,
      required: [true, 'Please select a hostel block'],
      enum: ['Block A', 'Block B', 'Block C', 'Block D'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Please add a room number'],
      trim: true,
    },
    emergencyContact: {
      type: String,
      required: [true, 'Please add an emergency contact number'],
      trim: true,
    },
    feeStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial', 'Overdue'],
      default: 'Pending',
    },
    totalFee: {
      type: Number,
      default: 4500, // Standard monthly fee ₹4,500
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountPending: {
      type: Number,
      default: 4500,
    },
    paymentMonth: {
      type: String,
      default: 'February 2025',
    },
    paymentDate: {
      type: Date,
    },
    paymentDueDate: {
      type: Date,
    },
    checkInDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);
