import {
  Smartphone,
  Shield,
  MessageCircle,
  Database,
  Scale,
} from "lucide-react";
import { ModuleFormData } from "@/types/dashboard";

export const defaultModulesData: ModuleFormData[] = [
  {
    title: { en: "Digital Basics", ne: "डिजिटल आधारभूत" },
    description: {
      en: "Introduction to computers, internet, and digital devices",
      ne: "कम्प्युटर, इन्टरनेट र डिजिटल उपकरणहरूको परिचय",
    },
    duration: 45,
    difficulty: "BEGINNER",
    category: "DIGITAL_LITERACY",
    isOffline: true,
    lessons: [
      {
        title: { en: "What is a Computer?", ne: "कम्प्युटर के हो?" },
        content: {
          en: "Learn about basic computer components",
          ne: "कम्प्युटरका आधारभूत भागहरूको बारेमा जान्नुहोस्",
        },
        order: 1,
      },
      {
        title: { en: "Internet Basics", ne: "इन्टरनेट आधारभूत" },
        content: {
          en: "Understanding how the internet works",
          ne: "इन्टरनेट कसरी काम गर्छ भनेर बुझ्नुहोस्",
        },
        order: 2,
      },
      {
        title: { en: "Digital Devices", ne: "डिजिटल उपकरणहरू" },
        content: {
          en: "Types of digital devices and their uses",
          ne: "डिजिटल उपकरणहरूका प्रकार र तिनका प्रयोगहरू",
        },
        order: 3,
      },
      {
        title: { en: "Operating Systems", ne: "अपरेटिङ सिस्टम" },
        content: {
          en: "Introduction to operating systems",
          ne: "अपरेटिङ सिस्टमको परिचय",
        },
        order: 4,
      },
      {
        title: { en: "File Management", ne: "फाइल व्यवस्थापन" },
        content: {
          en: "How to organize and manage files",
          ne: "फाइलहरू कसरी व्यवस्थित र व्यवस्थापन गर्ने",
        },
        order: 5,
      },
      {
        title: { en: "Practice Test", ne: "अभ्यास परीक्षा" },
        content: {
          en: "Test your digital basics knowledge",
          ne: "तपाईंको डिजिटल आधारभूत ज्ञान परीक्षण गर्नुहोस्",
        },
        order: 6,
      },
    ],
    todos: [
      {
        id: 0,
        title: {
          en: "Identify computer components",
          ne: "कम्प्युटर भागहरू पहिचान गर्नुहोस्",
        },
        description: {
          en: "Name the main parts of a computer",
          ne: "कम्प्युटरका मुख्य भागहरूको नाम भन्नुहोस्",
        },
        order: 1,
      },
      {
        id: 1,
        title: { en: "Navigate a web browser", ne: "वेब ब्राउजर चलाउनुहोस्" },
        description: {
          en: "Practice using a web browser to search information",
          ne: "जानकारी खोज्न वेब ब्राउजर प्रयोग गर्ने अभ्यास गर्नुहोस्",
        },
        order: 2,
      },
      {
        id: 2,
        title: {
          en: "Create and organize folders",
          ne: "फोल्डरहरू सिर्जना र व्यवस्थापन गर्नुहोस्",
        },
        description: {
          en: "Practice creating and organizing files and folders",
          ne: "फाइल र फोल्डरहरू सिर्जना र व्यवस्थापन गर्ने अभ्यास गर्नुहोस्",
        },
        order: 3,
      },
      {
        id: 3,
        title: {
          en: "Complete practice exercises",
          ne: "अभ्यास अभ्यासहरू पूरा गर्नुहोस्",
        },
        description: {
          en: "Finish all hands-on practice activities",
          ne: "सबै व्यावहारिक अभ्यास गतिविधिहरू समाप्त गर्नुहोस्",
        },
        order: 4,
      },
    ],
  },
];

// Map icons to categories for UI display
export const getModuleIcon = (category: string) => {
  switch (category) {
    case "DIGITAL_LITERACY":
      return Smartphone;
    case "CYBERSECURITY":
      return Shield;
    case "DIGITAL_COMMUNICATION":
      return MessageCircle;
    case "DATA_PRIVACY":
      return Database;
    case "ONLINE_ETHICS":
      return Scale;
    default:
      return Smartphone;
  }
};

// Map colors to different modules
export const getModuleColor = (index: number) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-orange-500",
  ];
  return colors[index % colors.length];
};

export const initializeModules = async (): Promise<void> => {
  try {
    // Check if modules exist
    const response = await fetch("/api/modules");
    const existingModules = await response.json();

    // If no modules exist, create default ones
    if (!existingModules || existingModules.length === 0) {
      console.log("No modules found, initializing default modules...");

      for (const moduleData of defaultModulesData) {
        try {
          const createResponse = await fetch("/api/modules", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(moduleData),
          });

          if (!createResponse.ok) {
            console.error("Failed to create module:", moduleData.title.en);
          } else {
            console.log("Created module:", moduleData.title.en);
          }
        } catch (error) {
          console.error("Error creating module:", moduleData.title.en, error);
        }
      }
    }
  } catch (error) {
    console.error("Error initializing modules:", error);
  }
};
