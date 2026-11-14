import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { createEvent, createTask, deleteEvent, deleteTask, getEvent, listEvents, updateEvent, updateTask } from '../controllers/eventController.js';

const router = Router();

router.use(authenticate);
router.route('/').get(listEvents).post(createEvent);
router.route('/:id').get(getEvent).put(updateEvent).delete(deleteEvent);
router.route('/:id/tasks').post(createTask);
router.route('/:id/tasks/:taskId').put(updateTask).delete(deleteTask);

export default router;
