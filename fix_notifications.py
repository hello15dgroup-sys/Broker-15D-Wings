import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

old_alerts = """    const defaultAlerts: NotificationItem[] = [
      {
        id: "onboarding-welcome",
        type: "system",
        title: "Welcome Onboarding Protocol",
        message: "Welcome back! To finalize your charter booking, please note that your total payment is split into two installments: a commitment deposit due upon signing, and the final balance, which must be settled 48 hours prior to takeoff. Thank you for securing your journey with 15D Wings.",
        timestamp: new Date("2026-07-10T12:00:00Z").toISOString(),
        read: false
      },
      {
        id: "icc-clearance",
        type: "icc",
        title: "ICC Strategic Directive 12-A",
        message: "General Aviation corridor overflight clearance secured for VIP Flight. Clear skies established.",
        timestamp: new Date("2026-07-10T12:05:00Z").toISOString(),
        read: false
      },
      {
        id: "operator-welcome",
        type: "chat",
        title: "Operator Dispatch Feed",
        message: "Welcome aboard. Ground dispatch team stands ready at Lagos MMA General Aviation Terminal for immediate logistics deployment.",
        timestamp: new Date("2026-07-10T12:10:00Z").toISOString(),
        read: false
      }
    ];"""

new_alerts = """    const defaultAlerts: NotificationItem[] = [
      {
        id: "broker-welcome",
        type: "system",
        title: "Welcome to Broker Command",
        message: "Your CRM is active. Access live market rates, manage verified operators, and generate white-labeled proposals directly from this unified workspace.",
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: "margin-directive",
        type: "icc",
        title: "Margin & Yield Control",
        message: "Pricing Directive: You have full control to mark up margins on generated proposals based on your own discretion to maximize your yield per deal.",
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: "settlement-engine",
        type: "system",
        title: "Guaranteed Certainty",
        message: "All flights booked through this ecosystem benefit from our same-day payment settlement engine, guaranteeing certainty and protecting your operator network.",
        timestamp: new Date().toISOString(),
        read: false
      }
    ];"""

content = content.replace(old_alerts, new_alerts)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
