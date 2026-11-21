# CivicResolve
### AI-Powered Civic Issue Reporting and Management Platform

**CivicResolve** is a digital platform that connects citizens with municipal officers to make civic issue reporting, tracking, and resolution more transparent and efficient.

Citizens can report problems such as damaged roads, water leakage, overflowing garbage, and broken streetlights. Municipal officers can review submitted complaints, prioritize issues, and publish status updates through a centralized dashboard.

**Live Application:** https://civicresolve-35ee1.web.app

**GitHub Repository:** https://github.com/VARSHA-A-R/CivicResolve

---

## 1. Problem Statement

Civic issues are frequently reported through disconnected channels, making it difficult for citizens to know whether their complaints have been received or addressed.

At the same time, municipal officers face challenges in organizing complaints, identifying urgent issues, and monitoring resolution progress.

This creates a communication gap between citizens and local authorities.

## 2. Our Solution

CivicResolve provides a centralized digital platform where citizens can submit civic complaints and track their progress, while authorized municipal officers can manage complaints through a dedicated dashboard.

The platform uses AI-assisted classification to support complaint categorization and prioritization, helping officers make informed decisions.

It creates a transparent workflow between citizens and authorities, from complaint submission to status updates.

## 3. Key Features

### Citizen Portal
- Secure citizen registration and login.
- Submit complaints with title, description, address, and optional location details.
- Optional complaint photo attachment.
- Automatic tracking ID after successful complaint submission.
- Personal complaint dashboard.
- Real-time complaint status tracking and timeline.

### Officer Portal
- Dedicated officer login.
- Secure officer authorization.
- Centralized complaint management dashboard.
- Filter complaints by category, priority, and status.
- Dashboard statistics and priority indicators.
- Update complaint status.
- Maintain private officer notes.
- Export complaint data as CSV.

### AI-Assisted Intelligence
- AI-assisted complaint classification.
- Category and priority suggestions.
- Department routing assistance.
- Offline heuristic fallback when AI classification is unavailable.
- Officers retain final decision-making authority.

---

## 4. Application Screenshots and Demonstration

The following screenshots demonstrate the major modules and workflows of CivicResolve.

### 4.1 Welcome Page – Portal Selection

**Purpose:** The welcome page acts as the entry point to CivicResolve. It allows users to choose between the Citizen Portal and Officer Portal based on their role.

**What it does:**
- Introduces the CivicResolve platform.
- Provides separate access to citizen and officer workflows.
- Directs users to the appropriate login page.

**Screenshot:**

<!-- Add your welcome page screenshot below -->

![Welcome Page](docs/screenshots/welcome-page.png)

---

### 4.2 Citizen Registration and Login

**Purpose:** Allows citizens to create an account or securely sign in to access the complaint reporting system.

**What it does:**
- Provides email and password authentication.
- Supports new citizen registration.
- Allows existing users to access their accounts.
- Provides account recovery functionality.

**Screenshot:**

<!-- Add your citizen login screenshot below -->

![Citizen Login](docs/screenshots/citizen-login.png)

---

### 4.3 Citizen Dashboard – My Civic Ledger

**Purpose:** Provides citizens with a centralized view of their submitted complaints and their current progress.

**What it does:**
- Displays complaints submitted by the logged-in citizen.
- Shows complaint tracking information.
- Displays the latest status of each complaint.
- Helps citizens monitor the progress of reported issues.

**Screenshot:**

<!-- Add your citizen dashboard screenshot below -->

![Citizen Dashboard](docs/screenshots/citizen-dashboard.png)

---

### 4.4 Complaint Submission

**Purpose:** Enables citizens to report civic problems directly through the application.

**What it does:**
- Collects complaint title and description.
- Captures the issue location and address.
- Supports optional photo attachments.
- Uses location assistance where browser permissions are available.
- Generates a tracking ID after successful database submission.

**Screenshot:**

<!-- Add your complaint submission screenshot below -->

![Complaint Submission](docs/screenshots/complaint-submission.png)

---

### 4.5 Complaint Tracking and Status Timeline

**Purpose:** Provides transparency by allowing citizens to follow the progress of their submitted complaints.

**What it does:**
- Displays complaint details using tracking information.
- Shows officer-published status updates.
- Maintains a visible timeline of complaint progress.
- Updates the citizen's view when complaint status changes.

**Screenshot:**

<!-- Add your complaint tracking screenshot below -->

![Complaint Tracking](docs/screenshots/complaint-tracking.png)

---

### 4.6 Officer Login

**Purpose:** Provides a dedicated authentication portal for authorized municipal officers.

**What it does:**
- Allows provisioned officers to sign in.
- Verifies officer authorization using their authenticated account.
- Prevents ordinary citizen accounts from accessing officer functions.

**Screenshot:**

<!-- Add your officer login screenshot below -->

![Officer Login](docs/screenshots/officer-login.png)

---

### 4.7 Officer Dashboard

**Purpose:** Acts as the central complaint management interface for authorized municipal officers.

**What it does:**
- Displays complaints submitted by citizens.
- Shows complaint counts and priority indicators.
- Provides category, priority, status, and text filters.
- Helps officers identify complaints requiring attention.
- Displays complaint information for review.

**Screenshot:**

<!-- Add your officer dashboard screenshot below -->

![Officer Dashboard](docs/screenshots/officer-dashboard.png)

---

### 4.8 Complaint Review and Status Management

**Purpose:** Allows officers to review individual complaints and communicate progress to citizens.

**What it does:**
- Displays detailed complaint information.
- Allows authorized officers to update complaint status.
- Supports private internal officer notes.
- Publishes status changes that citizens can track.

**Screenshot:**

<!-- Add your complaint management screenshot below -->

![Complaint Management](docs/screenshots/complaint-management.png)

---

### 4.9 AI-Assisted Complaint Classification

**Purpose:** Uses AI-assisted analysis to support the classification and prioritization of reported civic issues.

**What it does:**
- Analyzes complaint descriptions.
- Suggests relevant complaint categories.
- Assists with priority identification and department routing.
- Provides an offline heuristic fallback when AI classification is unavailable.

AI-generated results are advisory. Final decisions remain with authorized officers.

**Screenshot:**

<!-- Add your AI classification screenshot below -->

![AI Classification](docs/screenshots/ai-classification.png)

---

## 5. Sample Demo Login Credentials

Judges can use the following demo accounts to explore the application.

### Citizen Demo Account

| Field | Details |
|---|---|
| Portal | Citizen Login |
| Email / Username | `YOUR_DEMO_CITIZEN_EMAIL` |
| Password | `YOUR_DEMO_CITIZEN_PASSWORD` |

**Access:** Use this account to submit complaints, view the citizen dashboard, and track complaint progress.

### Officer Demo Account

| Field | Details |
|---|---|
| Portal | Officer Login |
| Email / Username | `YOUR_DEMO_OFFICER_EMAIL` |
| Password | `YOUR_DEMO_OFFICER_PASSWORD` |

**Access:** Use this account to view submitted complaints, filter the complaint queue, review details, and publish status updates.

**Note:** The officer demo account must be provisioned and authorized before testing. Officer access is verified through the corresponding `/officers/{uid}` document in Firestore. Officer registration is not publicly available.

---

## 6. How to Explore the Application

1. Open the live application: https://civicresolve-35ee1.web.app
2. Select the Citizen Portal.
3. Sign in using the Citizen Demo Account credentials.
4. Explore the citizen dashboard and existing complaints.
5. Submit a test complaint if needed.
6. Sign out and return to the welcome page.
7. Select the Officer Portal.
8. Sign in using the Officer Demo Account credentials.
9. Explore the complaint management dashboard.
10. Open a complaint and test the status update workflow.
11. Return to the Citizen Portal to observe the updated complaint status.

Please use test complaints rather than submitting genuine personal information.

---

## 7. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS, Lucide React |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| File Storage | Firebase Storage (when configured) |
| AI Integration | Firebase AI Logic / Gemini |
| Testing | Vitest, React Testing Library, Firestore Emulator |
| Deployment | Firebase Hosting |
| Containerization | Docker, Nginx |

---

## 8. Security and Access Control

CivicResolve uses Firebase Authentication and Firestore security rules to protect application data.

- Citizens can access their own complaint records according to the security rules.
- Officer access requires an authenticated account and a corresponding authorized officer record.
- Citizens cannot grant themselves officer privileges.
- Private officer notes and public complaint information are handled separately.
- Complaint submission does not allow citizens to create private officer assessments.
- AI-generated recommendations do not automatically authorize complaint decisions.

---

## 9. Future Enhancements

- More advanced AI-assisted complaint analysis.
- Improved department-level routing.
- Notifications for complaint status changes.
- Advanced analytics for municipal authorities.
- Geographic visualization of reported civic issues.
- Expanded administrative tools for officer management.

---

## 10. Project Links

| Resource | Link |
|---|---|
| Live Application | https://civicresolve-35ee1.web.app |
| GitHub Repository | https://github.com/VARSHA-A-R/CivicResolve |
| Hosting Platform | Firebase Hosting |

---

## 11. Conclusion

CivicResolve aims to make civic issue reporting more accessible, organized, and transparent by connecting citizens and municipal officers through a unified digital platform.

By combining real-time data management, secure role-based access, and AI-assisted classification, the platform supports a more structured approach to handling local civic issues.

**CivicResolve – Report. Track. Resolve.**
