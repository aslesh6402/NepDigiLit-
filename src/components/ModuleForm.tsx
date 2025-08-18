"use client";
import React, { useState } from "react";
import { X, Plus, Minus, Save, BookOpen } from "lucide-react";
import { Lesson, ModuleFormData, Module } from "../types/dashboard";

interface ModuleFormProps {
  module?: Module;
  isOpen: boolean;
  onClose: () => void;
  onSave: (moduleData: ModuleFormData) => Promise<void>;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  module,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ModuleFormData>({
    title: {
      en: module?.title?.en || "",
      ne: module?.title?.ne || "",
    },
    description: {
      en: module?.description?.en || "",
      ne: module?.description?.ne || "",
    },
    category: module?.category || "DIGITAL_LITERACY",
    difficulty: module?.difficulty || "BEGINNER",
    duration: module?.duration || 30,
    isOffline: module?.isOffline ?? true,
    lessons: module?.lessons || [
      {
        title: { en: "", ne: "" },
        content: { en: "", ne: "" },
        order: 1,
      },
    ],
    todos: module?.todos || [
      {
        id: 0,
        title: { en: "", ne: "" },
        description: { en: "", ne: "" },
        order: 1,
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ModuleFormData, value: any) => {
    setFormData((prev: ModuleFormData) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBilingualChange = (
    field: "title" | "description",
    lang: "en" | "ne",
    value: string
  ) => {
    setFormData((prev: ModuleFormData) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
      },
    }));
  };

  const handleLessonChange = (
    index: number,
    field: "title" | "content",
    lang: "en" | "ne",
    value: string
  ) => {
    const updatedLessons = [...formData.lessons];
    if (!updatedLessons[index][field]) {
      updatedLessons[index][field] = { en: "", ne: "" };
    }
    updatedLessons[index][field][lang] = value;
    setFormData((prev: ModuleFormData) => ({
      ...prev,
      lessons: updatedLessons,
    }));
  };

  const addLesson = () => {
    setFormData((prev: ModuleFormData) => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          title: { en: "", ne: "" },
          content: { en: "", ne: "" },
          order: prev.lessons.length + 1,
        },
      ],
    }));
  };

  const removeLesson = (index: number) => {
    if (formData.lessons.length > 1) {
      setFormData((prev: ModuleFormData) => ({
        ...prev,
        lessons: prev.lessons.filter((_: Lesson, i: number) => i !== index),
      }));
    }
  };

  const updateTodo = (index: number, field: keyof any, language: "en" | "ne", value: string) => {
    const updatedTodos = [...formData.todos!];
    if (field === "title" || field === "description") {
      updatedTodos[index] = {
        ...updatedTodos[index],
        [field]: {
          ...updatedTodos[index][field],
          [language]: value,
        },
      };
    }
    setFormData((prev: ModuleFormData) => ({
      ...prev,
      todos: updatedTodos,
    }));
  };

  const addTodo = () => {
    setFormData((prev: ModuleFormData) => ({
      ...prev,
      todos: [
        ...(prev.todos || []),
        {
          id: (prev.todos?.length || 0),
          title: { en: "", ne: "" },
          description: { en: "", ne: "" },
          order: (prev.todos?.length || 0) + 1,
        },
      ],
    }));
  };

  const removeTodo = (index: number) => {
    if ((formData.todos?.length || 0) > 1) {
      setFormData((prev: ModuleFormData) => ({
        ...prev,
        todos: prev.todos?.filter((_: any, i: number) => i !== index) || [],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.title.en || !formData.description.en) {
        alert("Please fill in at least the English title and description");
        setIsSubmitting(false);
        return;
      }

      await onSave({
        ...formData,
        ...(module?.id && { id: module.id }),
      });

      onClose();
    } catch (error) {
      console.error("Error saving module:", error);
      alert("Failed to save module. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
            {module ? "Edit Module" : "Create New Module"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Module Title */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (English) *
              </label>
              <input
                type="text"
                value={formData.title.en}
                onChange={(e) =>
                  handleBilingualChange("title", "en", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter module title in English"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (Nepali)
              </label>
              <input
                type="text"
                value={formData.title.ne}
                onChange={(e) =>
                  handleBilingualChange("title", "ne", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="नेपालीमा शीर्षक"
              />
            </div>
          </div>

          {/* Module Description */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (English) *
              </label>
              <textarea
                value={formData.description.en}
                onChange={(e) =>
                  handleBilingualChange("description", "en", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what students will learn"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Nepali)
              </label>
              <textarea
                value={formData.description.ne}
                onChange={(e) =>
                  handleBilingualChange("description", "ne", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="नेपालीमा विवरण"
              />
            </div>
          </div>

          {/* Module Settings */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="DIGITAL_LITERACY">Digital Literacy</option>
                <option value="CYBERSECURITY">Cybersecurity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  handleInputChange("difficulty", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  handleInputChange("duration", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offline Access
              </label>
              <select
                value={formData.isOffline.toString()}
                onChange={(e) =>
                  handleInputChange("isOffline", e.target.value === "true")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">Available Offline</option>
                <option value="false">Online Only</option>
              </select>
            </div>
          </div>

          {/* Lessons */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
              <button
                type="button"
                onClick={addLesson}
                className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Lesson
              </button>
            </div>

            <div className="space-y-4">
              {formData.lessons.map((lesson: Lesson, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Lesson {index + 1}
                    </h4>
                    {formData.lessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLesson(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lesson Title (English)
                      </label>
                      <input
                        type="text"
                        value={lesson.title?.en || ""}
                        onChange={(e) =>
                          handleLessonChange(
                            index,
                            "title",
                            "en",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter lesson title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lesson Title (Nepali)
                      </label>
                      <input
                        type="text"
                        value={lesson.title?.ne || ""}
                        onChange={(e) =>
                          handleLessonChange(
                            index,
                            "title",
                            "ne",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="नेपालीमा शीर्षक"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content (English)
                      </label>
                      <textarea
                        value={lesson.content?.en || ""}
                        onChange={(e) =>
                          handleLessonChange(
                            index,
                            "content",
                            "en",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter lesson content"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content (Nepali)
                      </label>
                      <textarea
                        value={lesson.content?.ne || ""}
                        onChange={(e) =>
                          handleLessonChange(
                            index,
                            "content",
                            "ne",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="नेपालीमा सामग्री"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Tasks/Todos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Module Tasks</h3>
              <button
                type="button"
                onClick={addTodo}
                className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </button>
            </div>
            <div className="space-y-4">
              {(formData.todos || []).map((todo: any, index: number) => (
                <div
                  key={index}
                  className="p-4 border-2 border-green-200 rounded-lg bg-green-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-700">
                      Task {index + 1}
                    </span>
                    {(formData.todos?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTodo(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Title (English)
                      </label>
                      <input
                        type="text"
                        value={todo.title?.en || ""}
                        onChange={(e) =>
                          updateTodo(index, "title", "en", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Title (Nepali)
                      </label>
                      <input
                        type="text"
                        value={todo.title?.ne || ""}
                        onChange={(e) =>
                          updateTodo(index, "title", "ne", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="नेपालीमा कार्य शीर्षक"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (English)
                      </label>
                      <textarea
                        value={todo.description?.en || ""}
                        onChange={(e) =>
                          updateTodo(index, "description", "en", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter task description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Nepali)
                      </label>
                      <textarea
                        value={todo.description?.ne || ""}
                        onChange={(e) =>
                          updateTodo(index, "description", "ne", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="नेपालीमा कार्य विवरण"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting
                ? "Saving..."
                : module
                ? "Update Module"
                : "Create Module"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleForm;
