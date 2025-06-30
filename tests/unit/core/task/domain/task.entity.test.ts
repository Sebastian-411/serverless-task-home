import type { CreateTaskData } from "../../../../../core/task/domain";
import {
  Task,
  TaskStatus,
  TaskPriority,
} from "../../../../../core/task/domain";

describe("Task Entity", () => {
  const mockTaskData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Test Task",
    description: "Test Description",
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: "2024-12-31T00:00:00.000Z",
    assignedTo: "user-123",
    createdBy: "creator-456",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  describe("Constructor", () => {
    it("should create a task with all properties", () => {
      const task = new Task(mockTaskData);

      expect(task.id).toBe(mockTaskData.id);
      expect(task.title).toBe(mockTaskData.title);
      expect(task.description).toBe(mockTaskData.description);
      expect(task.status).toBe(mockTaskData.status);
      expect(task.priority).toBe(mockTaskData.priority);
      expect(task.dueDate).toEqual(mockTaskData.dueDate);
      expect(task.assignedTo).toBe(mockTaskData.assignedTo);
      expect(task.createdBy).toBe(mockTaskData.createdBy);
    });

    it("should create a task without optional properties", () => {
      const taskDataWithoutOptional = {
        ...mockTaskData,
        dueDate: undefined,
        assignedTo: undefined,
      };

      const task = new Task(taskDataWithoutOptional);

      expect(task.dueDate).toBeUndefined();
      expect(task.assignedTo).toBeUndefined();
    });
  });

  describe("Static create method", () => {
    it("should create a new task with default values", () => {
      const createData: CreateTaskData = {
        title: "New Task",
        description: "New Description",
        createdBy: "creator-123",
      };

      const task = Task.create(createData);

      expect(task.title).toBe(createData.title);
      expect(task.description).toBe(createData.description);
      expect(task.createdBy).toBe(createData.createdBy);
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it("should create a task with custom priority", () => {
      const createData: CreateTaskData = {
        title: "High Priority Task",
        description: "Important task",
        priority: TaskPriority.HIGH,
        createdBy: "creator-123",
      };

      const task = Task.create(createData);

      expect(task.priority).toBe(TaskPriority.HIGH);
    });

    it("should create a task with due date and assigned user", () => {
      const dueDate = "2024-12-31T00:00:00.000Z";
      const createData: CreateTaskData = {
        title: "Assigned Task",
        description: "Task with assignment",
        dueDate,
        assignedTo: "user-123",
        createdBy: "creator-456",
      };

      const task = Task.create(createData);

      expect(task.dueDate).toEqual(dueDate);
      expect(task.assignedTo).toBe("user-123");
    });
  });

  describe("Business logic methods", () => {
    let task: Task;

    beforeEach(() => {
      task = new Task(mockTaskData);
    });

    describe("canBeAssignedTo", () => {
      it("should return true for pending task", () => {
        expect(task.canBeAssignedTo("user-123")).toBe(true);
      });

      it("should return true for in-progress task", () => {
        task.updateStatus(TaskStatus.IN_PROGRESS);
        expect(task.canBeAssignedTo("user-123")).toBe(true);
      });

      it("should return false for completed task", () => {
        task.updateStatus(TaskStatus.COMPLETED);
        expect(task.canBeAssignedTo("user-123")).toBe(false);
      });
    });

    describe("canBeUpdatedBy", () => {
      it("should return true for creator", () => {
        expect(task.canBeUpdatedBy("creator-456", "USER")).toBe(true);
      });

      it("should return true for assigned user", () => {
        expect(task.canBeUpdatedBy("user-123", "USER")).toBe(true);
      });

      it("should return true for admin", () => {
        expect(task.canBeUpdatedBy("admin-789", "ADMIN")).toBe(true);
      });

      it("should return false for other users", () => {
        expect(task.canBeUpdatedBy("other-user", "USER")).toBe(false);
      });
    });

    describe("canBeViewedBy", () => {
      it("should return true for creator", () => {
        expect(task.canBeViewedBy("creator-456", "USER")).toBe(true);
      });

      it("should return true for assigned user", () => {
        expect(task.canBeViewedBy("user-123", "USER")).toBe(true);
      });

      it("should return true for admin", () => {
        expect(task.canBeViewedBy("admin-789", "ADMIN")).toBe(true);
      });

      it("should return false for other users", () => {
        expect(task.canBeViewedBy("other-user", "USER")).toBe(false);
      });
    });

    describe("isOverdue", () => {
      it("should return false for future due date", () => {
        task.updateDetails({ dueDate: "2025-12-31T00:00:00.000Z" });
        expect(task.isOverdue()).toBe(false);
      });

      it("should return true for past due date", () => {
        task.updateDetails({ dueDate: "2023-01-01T00:00:00.000Z" });
        expect(task.isOverdue()).toBe(true);
      });

      it("should return false for completed task with past due date", () => {
        task.updateDetails({
          dueDate: "2023-01-01T00:00:00.000Z",
          status: TaskStatus.COMPLETED,
        });
        expect(task.isOverdue()).toBe(false);
      });

      it("should return false for task without due date", () => {
        task.updateDetails({ dueDate: undefined });
        expect(task.isOverdue()).toBe(false);
      });
    });
  });

  describe("State change methods", () => {
    let task: Task;

    beforeEach(() => {
      task = new Task(mockTaskData);
    });

    describe("assignTo", () => {
      it("should assign task to user", () => {
        task.assignTo("new-user");
        expect(task.assignedTo).toBe("new-user");
      });

      it("should throw error when assigning completed task", () => {
        task.updateStatus(TaskStatus.COMPLETED);
        expect(() => task.assignTo("new-user")).toThrow(
          "Task cannot be assigned when completed",
        );
      });

      it("should update timestamp when assigning", () => {
        const originalUpdatedAt = task.updatedAt;
        task.assignTo("new-user");
        expect(new Date(task.updatedAt).getTime()).toBeGreaterThan(
          new Date(originalUpdatedAt).getTime(),
        );
      });
    });

    describe("updateStatus", () => {
      it("should update status", () => {
        task.updateStatus(TaskStatus.IN_PROGRESS);
        expect(task.status).toBe(TaskStatus.IN_PROGRESS);
      });

      it("should update timestamp", () => {
        const originalUpdatedAt = task.updatedAt;
        task.updateStatus(TaskStatus.COMPLETED);
        expect(new Date(task.updatedAt).getTime()).toBeGreaterThan(
          new Date(originalUpdatedAt).getTime(),
        );
      });
    });

    describe("updatePriority", () => {
      it("should update priority", () => {
        task.updatePriority(TaskPriority.HIGH);
        expect(task.priority).toBe(TaskPriority.HIGH);
      });

      it("should update timestamp", () => {
        const originalUpdatedAt = task.updatedAt;
        task.updatePriority(TaskPriority.LOW);
        expect(new Date(task.updatedAt).getTime()).toBeGreaterThan(
          new Date(originalUpdatedAt).getTime(),
        );
      });
    });

    describe("updateDetails", () => {
      it("should update multiple properties", () => {
        const newTitle = "Updated Title";
        const newDescription = "Updated Description";
        const newDueDate = "2025-01-01T00:00:00.000Z";

        task.updateDetails({
          title: newTitle,
          description: newDescription,
          dueDate: newDueDate,
        });

        expect(task.title).toBe(newTitle);
        expect(task.description).toBe(newDescription);
        expect(task.dueDate).toEqual(newDueDate);
      });

      it("should only update provided properties", () => {
        const originalTitle = task.title;
        const originalDescription = task.description;

        task.updateDetails({
          status: TaskStatus.COMPLETED,
        });

        expect(task.title).toBe(originalTitle);
        expect(task.description).toBe(originalDescription);
        expect(task.status).toBe(TaskStatus.COMPLETED);
      });

      it("should update timestamp", () => {
        const originalUpdatedAt = task.updatedAt;
        task.updateDetails({ title: "New Title" });
        expect(new Date(task.updatedAt).getTime()).toBeGreaterThan(
          new Date(originalUpdatedAt).getTime(),
        );
      });
    });
  });

  describe("Serialization", () => {
    it("should serialize to JSON correctly", () => {
      const task = new Task(mockTaskData);
      const json = task.toJSON();

      expect(json).toEqual(mockTaskData);
    });

    it("should handle undefined optional properties in JSON", () => {
      const taskDataWithoutOptional = {
        ...mockTaskData,
        dueDate: undefined,
        assignedTo: undefined,
      };

      const task = new Task(taskDataWithoutOptional);
      const json = task.toJSON();

      expect(json.dueDate).toBeUndefined();
      expect(json.assignedTo).toBeUndefined();
    });
  });
});
