const express = require("express");
const router = express.Router();

const studyController = require("../controllers/studyController");
const authMiddleware = require("../middleware/authMiddleware");

            //manda dados
router.post("/", authMiddleware, studyController.createStudy);

            //pega dados
router.get("/", authMiddleware, studyController.getStudies);

            //rota dashboard
router.get("/stats", authMiddleware, studyController.getDashboardStats);

            //deleta dados
router.delete("/:id", authMiddleware, studyController.deleteStudy);

module.exports = router;