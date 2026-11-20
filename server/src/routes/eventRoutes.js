import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { createEvent, addSuggestedTasks, createTask, deleteEvent, deleteTask, duplicateEvent, getEvent, listEvents, updateEvent, updateTask } from '../controllers/eventController.js';
import { assignVendor, listEventVendors, removeEventVendor, updateEventVendor } from '../controllers/eventVendorController.js';

const router = Router();

router.use(authenticate);
router.route('/').get(listEvents).post(createEvent);
router.route('/:id').get(getEvent).put(updateEvent).delete(deleteEvent);
router.post('/:id/duplicate', duplicateEvent);
router.route('/:id/tasks').post(createTask);
router.post('/:id/tasks/suggested', addSuggestedTasks);
router.route('/:id/tasks/:taskId').put(updateTask).delete(deleteTask);
router.route('/:id/vendors').get(listEventVendors).post(assignVendor);
router.route('/:id/vendors/:assignmentId').put(updateEventVendor).delete(removeEventVendor);

export default router;
