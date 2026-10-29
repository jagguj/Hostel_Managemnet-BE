const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  inspectDatabase,
  getAnalyticsSummary,
} = require('../controllers/studentController');

router.get('/db/inspect', inspectDatabase);
router.get('/analytics/summary', getAnalyticsSummary);

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
