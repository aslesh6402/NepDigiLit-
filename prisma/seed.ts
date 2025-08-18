import { PrismaClient, Category, Difficulty, Language } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample modules with bilingual content
  const modules = [
    {
      title: { en: 'Digital Basics', ne: 'डिजिटल आधारभूत' },
      description: { 
        en: 'Introduction to computers, internet, and digital devices',
        ne: 'कम्प्युटर, इन्टरनेट र डिजिटल उपकरणहरूको परिचय'
      },
      category: Category.DIGITAL_LITERACY,
      difficulty: Difficulty.BEGINNER,
      duration: 45,
      isOffline: true,
      lessons: [
        {
          title: { en: 'What is Digital Technology?', ne: 'डिजिटल प्रविधि के हो?' },
          content: { 
            en: 'Digital technology refers to electronic tools, systems, devices and resources that generate, store or process data.',
            ne: 'डिजिटल प्रविधि भनेको डेटा उत्पादन, भण्डारण वा प्रशोधन गर्ने इलेक्ट्रोनिक उपकरण, प्रणाली र स्रोतहरू हुन्।'
          },
          duration: 8,
          quiz: [
            {
              question: { en: 'What is digital technology?', ne: 'डिजिटल प्रविधि के हो?' },
              options: { 
                en: ['Only computers', 'Electronic tools that process data', 'Only smartphones', 'Only the internet'],
                ne: ['केवल कम्प्युटर', 'डेटा प्रशोधन गर्ने इलेक्ट्रोनिक उपकरणहरू', 'केवल स्मार्टफोन', 'केवल इन्टरनेट']
              },
              correct: 1
            }
          ]
        },
        {
          title: { en: 'Understanding Computers', ne: 'कम्प्युटर बुझ्दै' },
          content: { 
            en: 'A computer is an electronic device that can receive, store, process, and output information.',
            ne: 'कम्प्युटर एक इलेक्ट्रोनिक उपकरण हो जसले जानकारी प्राप्त गर्न, भण्डारण गर्न, प्रशोधन गर्न र आउटपुट गर्न सक्छ।'
          },
          duration: 10,
          quiz: [
            {
              question: { en: 'What is the brain of a computer called?', ne: 'कम्प्युटरको दिमागलाई के भनिन्छ?' },
              options: { 
                en: ['Memory', 'CPU', 'Hard Drive', 'Monitor'],
                ne: ['मेमोरी', 'सीपीयू', 'हार्ड ड्राइभ', 'मनिटर']
              },
              correct: 1
            }
          ]
        }
      ]
    },
    {
      title: { en: 'Internet Safety', ne: 'इन्टरनेट सुरक्षा' },
      description: { 
        en: 'Learn how to stay safe while browsing the internet',
        ne: 'इन्टरनेट ब्राउज गर्दा कसरी सुरक्षित रहने सिक्नुहोस्'
      },
      category: Category.CYBERSECURITY,
      difficulty: Difficulty.BEGINNER,
      duration: 60,
      isOffline: true,
      lessons: [
        {
          title: { en: 'Understanding Online Threats', ne: 'अनलाइन खतराहरू बुझ्दै' },
          content: { 
            en: 'Learn about common online threats and how to identify them.',
            ne: 'सामान्य अनलाइन खतराहरू र तिनीहरूलाई कसरी पहिचान गर्ने भन्ने बारे सिक्नुहोस्।'
          },
          duration: 15,
          quiz: [
            {
              question: { en: 'What is a common sign of a phishing email?', ne: 'फिसिङ इमेलको सामान्य संकेत के हो?' },
              options: { 
                en: ['Professional design', 'Urgent language', 'Correct spelling', 'Official logo'],
                ne: ['व्यावसायिक डिजाइन', 'जरुरी भाषा', 'सही हिज्जे', 'आधिकारिक लोगो']
              },
              correct: 1
            }
          ]
        }
      ]
    },
    {
      title: { en: 'Password Security', ne: 'पासवर्ड सुरक्षा' },
      description: { 
        en: 'Creating and managing strong, secure passwords',
        ne: 'बलियो र सुरक्षित पासवर्ड बनाउने र व्यवस्थापन गर्ने'
      },
      category: Category.CYBERSECURITY,
      difficulty: Difficulty.INTERMEDIATE,
      duration: 30,
      isOffline: true,
      lessons: [
        {
          title: { en: 'Creating Strong Passwords', ne: 'बलियो पासवर्ड बनाउने' },
          content: { 
            en: 'Learn the principles of creating passwords that are both strong and memorable.',
            ne: 'बलियो र सम्झन योग्य दुवै प्रकारका पासवर्ड बनाउने सिद्धान्तहरू सिक्नुहोस्।'
          },
          duration: 10,
          quiz: [
            {
              question: { en: 'What makes a password strong?', ne: 'पासवर्डलाई बलियो के बनाउँछ?' },
              options: { 
                en: ['Length only', 'Mix of characters', 'Personal information', 'Simple words'],
                ne: ['केवल लम्बाइ', 'अक्षरहरूको मिश्रण', 'व्यक्तिगत जानकारी', 'सरल शब्दहरू']
              },
              correct: 1
            }
          ]
        }
      ]
    },
    {
      title: { en: 'Social Media Awareness', ne: 'सामाजिक सञ्जाल चेतना' },
      description: { 
        en: 'Understanding privacy and safety on social platforms',
        ne: 'सामाजिक प्लेटफर्महरूमा गोपनीयता र सुरक्षा बुझ्ने'
      },
      category: Category.DIGITAL_LITERACY,
      difficulty: Difficulty.INTERMEDIATE,
      duration: 50,
      isOffline: true,
      lessons: [
        {
          title: { en: 'Privacy Settings', ne: 'गोपनीयता सेटिङहरू' },
          content: { 
            en: 'Learn how to configure privacy settings on popular social media platforms.',
            ne: 'लोकप्रिय सामाजिक सञ्जाल प्लेटफर्महरूमा गोपनीयता सेटिङहरू कसरी कन्फिगर गर्ने सिक्नुहोस्।'
          },
          duration: 12,
          quiz: [
            {
              question: { en: 'Why are privacy settings important?', ne: 'गोपनीयता सेटिङहरू किन महत्वपूर्ण छन्?' },
              options: { 
                en: ['To get more likes', 'To control who sees your content', 'To post more often', 'To use more features'],
                ne: ['धेरै लाइक पाउन', 'तपाईंको सामग्री कसले देख्छ नियन्त्रण गर्न', 'धेरै पोस्ट गर्न', 'धेरै सुविधाहरू प्रयोग गर्न']
              },
              correct: 1
            }
          ]
        }
      ]
    },
    {
      title: { en: 'Phishing Awareness', ne: 'फिसिङ चेतना' },
      description: { 
        en: 'Identifying and avoiding phishing attacks',
        ne: 'फिसिङ आक्रमणहरू पहिचान गर्ने र बच्ने'
      },
      category: Category.CYBERSECURITY,
      difficulty: Difficulty.INTERMEDIATE,
      duration: 40,
      isOffline: true,
      lessons: [
        {
          title: { en: 'Recognizing Phishing Attempts', ne: 'फिसिङ प्रयासहरू पहिचान गर्ने' },
          content: { 
            en: 'Learn to identify common phishing tactics and protect yourself from scams.',
            ne: 'सामान्य फिसिङ रणनीतिहरू पहिचान गर्न र घोटालाहरूबाट आफूलाई जोगाउन सिक्नुहोस्।'
          },
          duration: 15,
          quiz: [
            {
              question: { en: 'What should you do if you receive a suspicious email?', ne: 'शंकास्पद इमेल प्राप्त भएमा के गर्नुपर्छ?' },
              options: { 
                en: ['Click all links', 'Delete immediately', 'Verify independently', 'Forward to friends'],
                ne: ['सबै लिङ्कहरूमा क्लिक गर्ने', 'तुरुन्त मेटाउने', 'स्वतन्त्र रूपमा प्रमाणित गर्ने', 'साथीहरूलाई फर्वार्ड गर्ने']
              },
              correct: 2
            }
          ]
        }
      ]
    }
  ]

  for (const moduleData of modules) {
    await prisma.module.create({
      data: moduleData
    })
  }

  // Create sample achievements with bilingual content
  const achievements = [
    {
      name: { en: 'First Steps', ne: 'पहिलो कदम' },
      description: { en: 'Completed your first module', ne: 'तपाईंको पहिलो मोड्युल पूरा गर्नुभयो' },
      icon: 'trophy',
      criteria: { modulesCompleted: 1 }
    },
    {
      name: { en: 'Digital Explorer', ne: 'डिजिटल अन्वेषक' },
      description: { en: 'Completed 3 modules', ne: '३ मोड्युलहरू पूरा गर्नुभयो' },
      icon: 'star',
      criteria: { modulesCompleted: 3 }
    },
    {
      name: { en: 'Cyber Guardian', ne: 'साइबर संरक्षक' },
      description: { en: 'Perfect score on cybersecurity module', ne: 'साइबर सुरक्षा मोड्युलमा पूर्ण अंक' },
      icon: 'shield',
      criteria: { perfectScore: true, category: 'CYBERSECURITY' }
    },
    {
      name: { en: 'Consistent Learner', ne: 'निरन्तर सिकारु' },
      description: { en: 'Learned for 5 days in a row', ne: 'लगातार ५ दिन सिक्नुभयो' },
      icon: 'calendar',
      criteria: { consecutiveDays: 5 }
    }
  ]

  for (const achievementData of achievements) {
    await prisma.achievement.create({
      data: achievementData
    })
  }

  console.log('Database seeded successfully with bilingual content!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })