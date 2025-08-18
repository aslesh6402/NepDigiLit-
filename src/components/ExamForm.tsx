"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Question {
  question: { en: string; ne: string };
  options: { en: string; ne: string }[];
  correctAnswer: number;
  marks: number;
  explanation?: { en: string; ne: string };
}

interface ExamFormData {
  id?: string;
  title: { en: string; ne: string };
  description: { en: string; ne: string };
  moduleId?: string;
  questions: Question[];
  totalMarks: number;
  duration: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  proctoringEnabled: boolean;
  allowTabSwitch: boolean;
  maxTabSwitches: number;
  webcamRequired: boolean;
  fullScreenRequired: boolean;
  showResults: boolean;
  passingMarks: number;
  startDate: string;
  endDate: string;
}

interface ExamFormProps {
  exam?: any;
  modules: any[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (examData: ExamFormData) => Promise<void>;
}

const ExamForm: React.FC<ExamFormProps> = ({
  exam,
  modules,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ExamFormData>({
    title: { en: "", ne: "" },
    description: { en: "", ne: "" },
    moduleId: "",
    questions: [
      {
        question: { en: "", ne: "" },
        options: [
          { en: "", ne: "" },
          { en: "", ne: "" },
          { en: "", ne: "" },
          { en: "", ne: "" },
        ],
        correctAnswer: 0,
        marks: 1,
      },
    ],
    totalMarks: 1,
    duration: 60,
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    proctoringEnabled: true,
    allowTabSwitch: false,
    maxTabSwitches: 0,
    webcamRequired: false,
    fullScreenRequired: true,
    showResults: false,
    passingMarks: 60,
    startDate: "",
    endDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (exam) {
      // Set default dates to current date/time if editing existing exam
      const now = new Date();
      const startDate = exam.startDate
        ? new Date(exam.startDate).toISOString().slice(0, 16)
        : now.toISOString().slice(0, 16);
      const endDate = exam.endDate
        ? new Date(exam.endDate).toISOString().slice(0, 16)
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16);

      setFormData({
        id: exam.id,
        title: exam.title || { en: "", ne: "" },
        description: exam.description || { en: "", ne: "" },
        moduleId: exam.moduleId || "",
        questions: exam.questions || formData.questions,
        totalMarks:
          exam.totalMarks ||
          calculateTotalMarks(exam.questions || formData.questions),
        duration: exam.duration || 60,
        maxAttempts: exam.maxAttempts || 1,
        shuffleQuestions: exam.shuffleQuestions ?? true,
        shuffleOptions: exam.shuffleOptions ?? true,
        proctoringEnabled: exam.proctoringEnabled ?? true,
        allowTabSwitch: exam.allowTabSwitch ?? false,
        maxTabSwitches: exam.maxTabSwitches || 0,
        webcamRequired: exam.webcamRequired ?? false,
        fullScreenRequired: exam.fullScreenRequired ?? true,
        showResults: exam.showResults ?? false,
        passingMarks: exam.passingMarks || 60,
        startDate,
        endDate,
      });
    } else {
      // Set default dates for new exam
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        startDate: now.toISOString().slice(0, 16),
        endDate: nextWeek.toISOString().slice(0, 16),
      }));
    }
  }, [exam]);

  const calculateTotalMarks = (questions: Question[]) => {
    return questions.reduce((total, q) => total + (q.marks || 1), 0);
  };

  const handleBilingualChange = (
    field: "title" | "description",
    lang: "en" | "ne",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
      },
    }));
  };

  const handleQuestionChange = (
    index: number,
    field: "question",
    lang: "en" | "ne",
    value: string
  ) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index][field][lang] = value;
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
      totalMarks: calculateTotalMarks(updatedQuestions),
    }));
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    lang: "en" | "ne",
    value: string
  ) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex][lang] = value;
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const handleQuestionMarksChange = (index: number, marks: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index].marks = marks;
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
      totalMarks: calculateTotalMarks(updatedQuestions),
    }));
  };

  const handleCorrectAnswerChange = (
    questionIndex: number,
    optionIndex: number
  ) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].correctAnswer = optionIndex;
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: { en: "", ne: "" },
          options: [
            { en: "", ne: "" },
            { en: "", ne: "" },
            { en: "", ne: "" },
            { en: "", ne: "" },
          ],
          correctAnswer: 0,
          marks: 1,
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const updatedQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        questions: updatedQuestions,
        totalMarks: calculateTotalMarks(updatedQuestions),
      }));
    }
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push({ en: "", ne: "" });
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[questionIndex].options.length > 2) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      // Adjust correct answer if necessary
      if (updatedQuestions[questionIndex].correctAnswer >= optionIndex) {
        updatedQuestions[questionIndex].correctAnswer = Math.max(
          0,
          updatedQuestions[questionIndex].correctAnswer - 1
        );
      }
      setFormData((prev) => ({
        ...prev,
        questions: updatedQuestions,
      }));
    }
  };

  const validateForm = () => {
    const validationErrors: string[] = [];

    if (!formData.title.en.trim()) {
      validationErrors.push("English title is required");
    }

    if (!formData.description.en.trim()) {
      validationErrors.push("English description is required");
    }

    if (!formData.startDate) {
      validationErrors.push("Start date is required");
    }

    if (!formData.endDate) {
      validationErrors.push("End date is required");
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      validationErrors.push("End date must be after start date");
    }

    if (formData.passingMarks > formData.totalMarks) {
      validationErrors.push("Passing marks cannot exceed total marks");
    }

    formData.questions.forEach((question, qIndex) => {
      if (!question.question.en.trim()) {
        validationErrors.push(
          `Question ${qIndex + 1}: English question text is required`
        );
      }

      if (question.options.length < 2) {
        validationErrors.push(
          `Question ${qIndex + 1}: At least 2 options are required`
        );
      }

      question.options.forEach((option, oIndex) => {
        if (!option.en.trim()) {
          validationErrors.push(
            `Question ${qIndex + 1}, Option ${
              oIndex + 1
            }: English text is required`
          );
        }
      });

      if (question.correctAnswer >= question.options.length) {
        validationErrors.push(
          `Question ${qIndex + 1}: Invalid correct answer selection`
        );
      }

      if (!question.marks || question.marks < 1) {
        validationErrors.push(
          `Question ${qIndex + 1}: Marks must be at least 1`
        );
      }
    });

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving exam:", error);
      setErrors(["Failed to save exam. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {exam ? "Edit Exam" : "Create Exam"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {errors.length > 0 && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-red-800 font-medium">
                      Please fix the following errors:
                    </h4>
                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter exam title in English"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="नेपालीमा परीक्षाको शीर्षक लेख्नुहोस्"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        moduleId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a module (optional)</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title?.en || "Untitled Module"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically calculated from questions
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    value={formData.passingMarks}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        passingMarks: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max={formData.totalMarks}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter exam description in English"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Security & Proctoring Settings */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Security & Proctoring Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.proctoringEnabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        proctoringEnabled: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Enable Proctoring</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.fullScreenRequired}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fullScreenRequired: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Require Full Screen</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shuffleQuestions: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Shuffle Questions</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.shuffleOptions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shuffleOptions: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Shuffle Options</span>
                </label>
              </div>
            </Card>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Questions</h3>
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-6">
                {formData.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-800">
                        Question {qIndex + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Marks:</label>
                        <input
                          type="number"
                          value={question.marks}
                          onChange={(e) =>
                            handleQuestionMarksChange(
                              qIndex,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="1"
                        />
                        {formData.questions.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question (English) *
                        </label>
                        <textarea
                          value={question.question.en}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              "question",
                              "en",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter question in English"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question (Nepali)
                        </label>
                        <textarea
                          value={question.question.ne}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              "question",
                              "ne",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="नेपालीमा प्रश्न लेख्नुहोस्"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Options
                          </label>
                          <Button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <div
                              key={oIndex}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={question.correctAnswer === oIndex}
                                onChange={() =>
                                  handleCorrectAnswerChange(qIndex, oIndex)
                                }
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={option.en}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      qIndex,
                                      oIndex,
                                      "en",
                                      e.target.value
                                    )
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={`Option ${oIndex + 1} (English)`}
                                />
                                <input
                                  type="text"
                                  value={option.ne}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      qIndex,
                                      oIndex,
                                      "ne",
                                      e.target.value
                                    )
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={`विकल्प ${oIndex + 1} (नेपाली)`}
                                />
                              </div>
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <Button type="button" onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {exam ? "Update Exam" : "Create Exam"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamForm;
