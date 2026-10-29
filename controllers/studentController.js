const mongoose = require('mongoose');
const Student = require('../models/Student');

// In-memory fallback dataset for instant testing when MongoDB Cloud is not yet connected
let inMemoryStudents = [
  {
    _id: '1',
    name: 'Alex Morgan',
    rollNumber: 'CS2026-101',
    email: 'alex.m@university.edu',
    phone: '9876543210',
    hostelBlock: 'Block A',
    roomNumber: '101',
    emergencyContact: '9876543211',
    feeStatus: 'Paid',
    totalFee: 4500,
    amountPaid: 4500,
    amountPending: 0,
    paymentMonth: 'February 2026',
    paymentDate: new Date('2026-02-01'),
    paymentDueDate: new Date('2026-02-10'),
    checkInDate: new Date('2026-01-15'),
    createdAt: new Date('2026-02-01')
  },
  {
    _id: '2',
    name: 'Rohan Sharma',
    rollNumber: 'EC2026-205',
    email: 'rohan.s@university.edu',
    phone: '9123456789',
    hostelBlock: 'Block B',
    roomNumber: '205',
    emergencyContact: '9123456780',
    feeStatus: 'Overdue',
    totalFee: 4500,
    amountPaid: 1500,
    amountPending: 3000,
    paymentMonth: 'February 2026',
    paymentDate: new Date('2026-02-01'),
    paymentDueDate: new Date('2026-02-05'),
    checkInDate: new Date('2026-02-01'),
    createdAt: new Date('2026-02-01')
  },
  {
    _id: '3',
    name: 'Sophia Chen',
    rollNumber: 'ME2026-312',
    email: 'sophia.c@university.edu',
    phone: '9988776655',
    hostelBlock: 'Block C',
    roomNumber: '312',
    emergencyContact: '9988776600',
    feeStatus: 'Partial',
    totalFee: 4500,
    amountPaid: 2000,
    amountPending: 2500,
    paymentMonth: 'January 2026',
    paymentDate: new Date('2026-01-15'),
    paymentDueDate: new Date('2026-01-31'),
    checkInDate: new Date('2026-01-20'),
    createdAt: new Date('2026-01-15')
  }
];

const isDBConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all students (with payment notifications summary, month & year filter)
// @route   GET /api/students
const getStudents = async (req, res) => {
  try {
    const { search, block, feeStatus, overdue, month, year } = req.query;

    if (isDBConnected()) {
      await Student.updateMany(
        { $or: [{ paymentMonth: { $exists: false } }, { paymentMonth: null }, { paymentMonth: '' }] },
        { $set: { paymentMonth: 'February 2026' } }
      );

      let query = {};
      let andConditions = [];

      if (search) {
        andConditions.push({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { rollNumber: { $regex: search, $options: 'i' } },
            { roomNumber: { $regex: search, $options: 'i' } }
          ]
        });
      }
      if (block) query.hostelBlock = block;
      if (feeStatus) query.feeStatus = feeStatus;

      if (month) {
        const monthRegex = new RegExp(month, 'i');
        andConditions.push({
          $or: [
            { paymentMonth: monthRegex },
            { paymentDate: { $exists: true } } // will filter further or match
          ]
        });
      }

      if (year) {
        const yearRegex = new RegExp(year, 'i');
        andConditions.push({
          $or: [
            { paymentMonth: yearRegex },
            { paymentDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59.999Z`) } },
            { createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59.999Z`) } }
          ]
        });
      }

      if (overdue === 'true') {
        query.paymentDueDate = { $lt: new Date() };
        query.amountPending = { $gt: 0 };
      }

      if (andConditions.length > 0) {
        query.$and = andConditions;
      }

      let students = await Student.find(query).sort({ createdAt: -1 });

      // Client-side precise month filtering for 100% accuracy across paymentMonth and paymentDate
      if (month) {
        const mLower = month.toLowerCase();
        students = students.filter(s => {
          const pMonth = (s.paymentMonth || '').toLowerCase();
          const pDateStr = s.paymentDate ? new Date(s.paymentDate).toLocaleDateString('en-US', { month: 'long' }).toLowerCase() : '';
          return pMonth.includes(mLower) || pDateStr.includes(mLower);
        });
      }

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const allStudentsForAlerts = await Student.find({});
      const overdueStudents = allStudentsForAlerts.filter(s => s.paymentDueDate && new Date(s.paymentDueDate) < now && s.amountPending > 0);
      const upcomingStudents = allStudentsForAlerts.filter(s => s.paymentDueDate && new Date(s.paymentDueDate) >= now && new Date(s.paymentDueDate) <= sevenDaysFromNow && s.amountPending > 0);

      return res.status(200).json({
        success: true,
        count: students.length,
        data: students,
        notifications: {
          overdueCount: overdueStudents.length,
          upcomingCount: upcomingStudents.length,
          overdueList: overdueStudents,
          upcomingList: upcomingStudents
        }
      });
    }

    // Fallback in-memory mode
    let filtered = [...inMemoryStudents];
    filtered.forEach(s => {
      if (!s.paymentMonth) s.paymentMonth = 'February 2026';
    });

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        s => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q) || s.roomNumber.toLowerCase().includes(q)
      );
    }
    if (block) filtered = filtered.filter(s => s.hostelBlock === block);
    if (feeStatus) filtered = filtered.filter(s => s.feeStatus === feeStatus);
    if (month) {
      const mLower = month.toLowerCase();
      filtered = filtered.filter(s => {
        const pMonth = (s.paymentMonth || '').toLowerCase();
        const pDateStr = s.paymentDate ? new Date(s.paymentDate).toLocaleDateString('en-US', { month: 'long' }).toLowerCase() : '';
        return pMonth.includes(mLower) || pDateStr.includes(mLower);
      });
    }
    if (year) {
      filtered = filtered.filter(s => {
        const mStr = s.paymentMonth || '';
        const yrStr = new Date(s.paymentDate || s.createdAt || Date.now()).getFullYear().toString();
        return mStr.includes(year) || yrStr === year;
      });
    }
    if (overdue === 'true') {
      const now = new Date();
      filtered = filtered.filter(s => s.paymentDueDate && new Date(s.paymentDueDate) < now && s.amountPending > 0);
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const overdueList = inMemoryStudents.filter(s => s.paymentDueDate && new Date(s.paymentDueDate) < now && s.amountPending > 0);
    const upcomingList = inMemoryStudents.filter(s => s.paymentDueDate && new Date(s.paymentDueDate) >= now && new Date(s.paymentDueDate) <= sevenDaysFromNow && s.amountPending > 0);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
      notifications: {
        overdueCount: overdueList.length,
        upcomingCount: upcomingList.length,
        overdueList,
        upcomingList
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    if (isDBConnected()) {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      return res.status(200).json({ success: true, data: student });
    }

    const student = inMemoryStudents.find(s => s._id === req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register new student
// @route   POST /api/students
const createStudent = async (req, res) => {
  try {
    const {
      name,
      rollNumber,
      email,
      phone,
      hostelBlock,
      roomNumber,
      emergencyContact,
      feeStatus,
      totalFee,
      amountPaid,
      amountPending,
      paymentMonth,
      paymentDate,
      paymentDueDate,
      checkInDate
    } = req.body;

    if (isDBConnected()) {
      const existingStudent = await Student.findOne({ rollNumber });
      if (existingStudent) {
        return res.status(400).json({ success: false, message: 'Student with this roll number already exists' });
      }

      const student = await Student.create({
        name,
        rollNumber,
        email,
        phone,
        hostelBlock,
        roomNumber,
        emergencyContact,
        feeStatus: feeStatus || 'Pending',
        totalFee: totalFee || 4500,
        amountPaid: amountPaid || 0,
        amountPending: amountPending !== undefined ? amountPending : (totalFee || 4500),
        paymentMonth: paymentMonth || 'February 2026',
        paymentDate: paymentDate || null,
        paymentDueDate: paymentDueDate || null,
        checkInDate,
      });

      return res.status(201).json({ success: true, data: student });
    }

    const tFee = totalFee || 4500;
    const aPaid = amountPaid || 0;
    const aPending = amountPending !== undefined ? amountPending : (tFee - aPaid);

    const newStudent = {
      _id: Date.now().toString(),
      name,
      rollNumber,
      email,
      phone,
      hostelBlock,
      roomNumber,
      emergencyContact,
      feeStatus: feeStatus || (aPending === 0 ? 'Paid' : aPaid > 0 ? 'Partial' : 'Pending'),
      totalFee: tFee,
      amountPaid: aPaid,
      amountPending: aPending,
      paymentMonth: paymentMonth || 'February 2026',
      paymentDate: paymentDate || null,
      paymentDueDate: paymentDueDate || null,
      checkInDate: checkInDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryStudents.unshift(newStudent);
    res.status(201).json({ success: true, data: newStudent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    if (isDBConnected()) {
      let student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      student = await Student.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ success: true, data: student, message: 'Student record successfully updated in database' });
    }

    const index = inMemoryStudents.findIndex(s => s._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    inMemoryStudents[index] = { ...inMemoryStudents[index], ...req.body, updatedAt: new Date() };
    res.status(200).json({ success: true, data: inMemoryStudents[index], message: 'Student record successfully updated in memory database' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete student record
// @route   DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    if (isDBConnected()) {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      await student.deleteOne();
      return res.status(200).json({ success: true, message: 'Student record removed from database' });
    }

    const index = inMemoryStudents.findIndex(s => s._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    inMemoryStudents.splice(index, 1);
    res.status(200).json({ success: true, message: 'Student record removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get total aggregated financial & student analytics summary
// @route   GET /api/students/analytics/summary
const getAnalyticsSummary = async (req, res) => {
  try {
    const connected = isDBConnected();
    const students = connected ? await Student.find({}) : inMemoryStudents;

    const totalStudents = students.length;
    const totalRevenueExpected = students.reduce((acc, s) => acc + (s.totalFee || 4500), 0);
    const totalRevenueCollected = students.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
    const totalPendingDues = students.reduce((acc, s) => acc + (s.amountPending || 0), 0);
    const overdueCount = students.filter(s => s.paymentDueDate && new Date(s.paymentDueDate) < new Date() && (s.amountPending || 0) > 0).length;

    const blockCounts = {
      'Block A': students.filter(s => s.hostelBlock === 'Block A').length,
      'Block B': students.filter(s => s.hostelBlock === 'Block B').length,
      'Block C': students.filter(s => s.hostelBlock === 'Block C').length,
      'Block D': students.filter(s => s.hostelBlock === 'Block D').length,
    };

    res.status(200).json({
      success: true,
      analytics: {
        totalStudents,
        totalRevenueExpected,
        totalRevenueCollected,
        totalPendingDues,
        overdueCount,
        blockCounts,
        allStudents: students
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, analytics: {} });
  }
};

// @desc    Inspect raw database data & connection status
// @route   GET /api/students/db/inspect
const inspectDatabase = async (req, res) => {
  try {
    const connected = isDBConnected();
    let records = [];
    let dbInfo = {
      status: connected ? 'Connected to MongoDB Atlas' : 'Running in-memory fallback mode',
      host: connected ? mongoose.connection.host : 'In-Memory Store',
      dbName: connected ? mongoose.connection.name : 'hostel_memory_db',
      readyState: mongoose.connection.readyState
    };

    if (connected) {
      records = await Student.find({}).sort({ updatedAt: -1 });
    } else {
      records = inMemoryStudents;
    }

    res.status(200).json({
      success: true,
      databaseInfo: dbInfo,
      count: records.length,
      rawCollectionData: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  inspectDatabase,
  getAnalyticsSummary,
};
