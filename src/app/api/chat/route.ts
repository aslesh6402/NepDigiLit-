import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, message, language = "en" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to use chat." },
        { status: 401 }
      );
    }
    const getAIResponse = (userMessage: string, lang: "en" | "ne"): string => {
      const lowerMessage = userMessage.toLowerCase();

      // Nepali responses
      if (lang === "ne") {
        if (
          lowerMessage.includes("पासवर्ड") ||
          lowerMessage.includes("password")
        ) {
          return "बलियो पासवर्ड कम्तिमा ८ अक्षरको हुनुपर्छ र ठूला अक्षर, साना अक्षर, संख्या र विशेष चिन्हहरूको मिश्रण हुनुपर्छ। आफ्नो पासवर्ड कसैसँग साझा नगर्नुहोस् र विभिन्न खाताहरूका लागि फरक पासवर्ड प्रयोग गर्नुहोस्। पासवर्ड व्यवस्थापकको प्रयोग गर्ने बारे सोच्नुहोस्।";
        }

        if (
          lowerMessage.includes("फिसिङ") ||
          lowerMessage.includes("phishing")
        ) {
          return "फिसिङ भनेको अपराधीहरूले नक्कली इमेल, सन्देश वा वेबसाइटहरू मार्फत तपाईंको व्यक्तिगत जानकारी लिन खोज्ने तरिका हो। सधैं पठाउनेको इमेल ठेगाना जाँच गर्नुहोस्, हिज्जे गल्तीहरू खोज्नुहोस् र शंकास्पद लिङ्कहरूमा क्लिक नगर्नुहोस्। शंका लाग्दा, संस्थालाई सिधै सम्पर्क गर्नुहोस्।";
        }

        if (
          lowerMessage.includes("साइबर सुरक्षा") ||
          lowerMessage.includes("cybersecurity")
        ) {
          return "साइबर सुरक्षा भनेको कम्प्युटर, नेटवर्क र व्यक्तिगत जानकारीलाई डिजिटल आक्रमणबाट जोगाउने अभ्यास हो। यसमा बलियो पासवर्ड प्रयोग गर्ने, सफ्टवेयर अपडेट राख्ने, अनलाइनमा के साझा गर्ने भन्नेमा सावधान रहने र अनलाइन घोटाला र खतराहरूको बारेमा सचेत रहने समावेश छ।";
        }

        if (
          lowerMessage.includes("डिजिटल साक्षरता") ||
          lowerMessage.includes("digital literacy")
        ) {
          return "डिजिटल साक्षरता भनेको डिजिटल प्रविधिलाई प्रभावकारी र सुरक्षित रूपमा प्रयोग गर्ने सीप हुनु हो। यसमा कम्प्युटर र इन्टरनेट कसरी प्रयोग गर्ने, अनलाइन गोपनीयता बुझ्ने, डिजिटल रूपमा सञ्चार गर्ने र अनलाइन जानकारी खोज्ने र मूल्याङ्कन गर्न सक्ने समावेश छ।";
        }

        return "यो राम्रो प्रश्न हो! तपाईंले सोधेको कुराको आधारमा, म हाम्रो सिकाइ मोड्युलहरू हेर्न सुझाव दिन्छु। तपाईं मलाई डिजिटल साक्षरता वा साइबर सुरक्षाको बारेमा थप विशिष्ट प्रश्नहरू पनि सोध्न सक्नुहुन्छ।";
      }

      // English responses (enhanced)
      if (lowerMessage.includes("password")) {
        return "A strong password should be at least 8 characters long and include a mix of uppercase letters, lowercase letters, numbers, and special characters. Never share your passwords with anyone, and use different passwords for different accounts. Consider using a password manager to keep track of your passwords safely. Enable two-factor authentication whenever possible for extra security.";
      }

      if (lowerMessage.includes("phishing")) {
        return "Phishing is when criminals try to trick you into giving them your personal information through fake emails, messages, or websites. Always check the sender's email address carefully, look for spelling mistakes and urgent language, and never click on suspicious links. When in doubt, contact the organization directly through their official website or phone number. Remember: legitimate organizations will never ask for passwords via email.";
      }

      if (
        lowerMessage.includes("cybersecurity") ||
        lowerMessage.includes("cyber security")
      ) {
        return "Cybersecurity is the practice of protecting computers, networks, and personal information from digital attacks. This includes using strong passwords, keeping software updated, being careful about what you share online, using secure Wi-Fi networks, and being aware of online scams and threats. It's like having a digital immune system to protect yourself online.";
      }

      if (lowerMessage.includes("digital literacy")) {
        return "Digital literacy means having the skills to use digital technology effectively and safely. This includes knowing how to use computers and the internet, understanding online privacy, communicating digitally, finding and evaluating information online, and being a responsible digital citizen. It's essential in today's connected world.";
      }

      if (lowerMessage.includes("privacy")) {
        return "To protect your online privacy: use strong, unique passwords; adjust privacy settings on social media; be careful about what personal information you share; use secure Wi-Fi networks; regularly review what apps and websites have access to your information; and consider using privacy-focused browsers and search engines.";
      }

      if (
        lowerMessage.includes("safe online") ||
        lowerMessage.includes("online safety")
      ) {
        return "To stay safe online: never share personal information with strangers; think before you post anything (it can be permanent); use privacy settings on social media; be careful about downloading files or clicking links; verify information before sharing it; and tell a trusted adult if something online makes you uncomfortable or seems suspicious.";
      }

      if (lowerMessage.includes("social media")) {
        return "Social media safety tips: adjust your privacy settings so only friends can see your posts; be careful about what you share (avoid personal details like your address or phone number); think before posting photos or comments; be kind and respectful to others; report bullying or inappropriate content; and remember that not everything you see online is true.";
      }

      return "That's a great question! Based on what you're asking, I'd recommend checking out our learning modules for detailed information. You can also ask me more specific questions about digital literacy or cybersecurity, and I'll do my best to help you understand these important topics. Remember, learning about digital safety is an ongoing process!";
    };

    const aiResponse = getAIResponse(message, language);

    // Save chat session if userId is provided
    if (userId) {
      await prisma.chatSession.create({
        data: {
          userId,
          language,
          messages: [
            { role: "user", content: message, timestamp: new Date(), language },
            {
              role: "assistant",
              content: aiResponse,
              timestamp: new Date(),
              language,
            },
          ],
        },
      });
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error processing chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
