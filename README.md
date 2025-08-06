# Suubi Medical Center - Staff Portal

A comprehensive healthcare staff management portal for Suubi Medical Center, built with Next.js, Convex, and Clerk authentication.

## 🏥 Role System

The portal uses a hierarchical role system with main categories and subcategories:

### Main Role Categories

1. **Doctor** - Medical professionals with advanced training
   - General Practitioner
   - Surgeon
   - Anesthesiologist
   - Pediatrician
   - Cardiologist
   - Oncologist
   - Neurologist
   - Radiologist
   - Psychiatrist
   - OB/GYN
   - Emergency Doctor
   - Internist

2. **Nurse** - Compassionate care specialists
   - Registered Nurse
   - Practical Nurse
   - Nurse Practitioner
   - Nurse Midwife
   - Nurse Anesthetist
   - ICU Nurse
   - ER Nurse
   - OR Nurse
   - Pediatric Nurse
   - Oncology Nurse

3. **Allied Health** - Specialized healthcare professionals
   - Lab Technologist
   - Radiographer
   - Pharmacist
   - Pharmacy Technician
   - Physiotherapist
   - Occupational Therapist
   - Speech Therapist
   - Dietitian
   - Medical Social Worker
   - Respiratory Therapist
   - Optometrist
   - Audiologist

4. **Support Staff** - Essential support and auxiliary staff
   - Healthcare Assistant
   - Ward Assistant
   - Cleaner
   - Laundry Staff
   - Cook
   - Porter
   - Driver
   - Security Officer

5. **Administrative Staff** - Hospital administration and management
   - Hospital Administrator
   - Medical Records Officer
   - Receptionist
   - Health Information Officer
   - Billing Officer
   - Cashier
   - Clerical Staff
   - HR Officer
   - Finance Officer
   - Procurement Officer
   - IT Officer
   - Quality Assurance Officer

6. **Technical Staff** - Technical and maintenance specialists
   - Biomedical Engineer
   - Maintenance Technician
   - IT Support Technician
   - Facility Manager

7. **Training & Research Staff** - Education, research and program staff
   - Medical Educator
   - Research Scientist
   - Clinical Researcher
   - Intern Coordinator
   - Health Program Officer

## 🗄️ Database Schema

### Users Table
- `clerkId` - Clerk authentication ID
- `email` - User email
- `firstName` - First name
- `lastName` - Last name
- `imageUrl` - Profile image URL
- `role` - Main role category
- `subRole` - Specific subcategory

### Staff Profiles Table
- `userId` - Reference to user
- `role` - Main role category
- `subRole` - Specific subcategory
- `specialty` - Medical specialty (for doctors)
- `licenseNumber` - License number
- `qualifications` - Array of qualifications
- `experience` - Years of experience
- `bio` - Professional biography
- `languages` - Languages spoken
- `consultationFee` - Consultation fee (for clinical staff)
- `isAvailable` - Availability status
- `rating` - Average rating
- `totalReviews` - Total number of reviews
- `profileImage` - Profile image URL
- `verified` - Verification status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## 🚀 Features

- **Hierarchical Role System** - Main categories with specific subcategories
- **Profile Management** - Comprehensive staff profiles with all necessary information
- **Authentication** - Secure authentication with Clerk
- **Real-time Updates** - Live updates using Convex
- **Mobile Responsive** - Optimized for all device sizes
- **Modern UI** - Beautiful, modern interface with smooth animations

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Convex
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📁 Project Structure

```
doctor/
├── app/
│   ├── components/
│   │   ├── AvailableTimeForm.tsx
│   │   ├── AvailableTimeList.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── ProfileImageUpload.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── convex/
│   ├── _generated/
│   ├── auth.config.ts
│   ├── availableTimes.ts
│   ├── crons.ts
│   ├── doctors.ts
│   ├── gallery.ts
│   ├── messages.ts
│   ├── news.ts
│   ├── newsemail.ts
│   ├── nurses.ts
│   ├── programemail.ts
│   ├── programs.ts
│   ├── room.ts
│   ├── schema.ts
│   ├── staffProfiles.ts
│   ├── subscribers.ts
│   └── users.ts
├── providers/
│   └── convexProviderWithClerk.tsx
├── public/
├── utils/
│   └── uploadthing.ts
└── README.md
```

## 🔧 Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## 📝 License

This project is licensed under the MIT License.
