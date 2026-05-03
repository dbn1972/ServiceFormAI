# ServiceFormAI OS: 10/10 Product Definition

## Working Product Name

**ServiceFormAI OS**

**Stronger category name:** **Citizen Service Intelligence Network**

**Strategic one-line definition:**

ServiceFormAI OS is a DigiLocker-first, federated Citizen Service Intelligence Network that lets governments, municipalities, universities, banks, utilities, and approved private providers publish schemes, services, benefits, renewals, and grievances once; lets citizens discover or receive relevant services through trusted channels; reuses verified DigiLocker documents with explicit consent; routes every case to the correct federal, state, local, or partner workflow; and tracks every step until the benefit, certificate, approval, service, or grievance resolution is delivered.

**Core transformation:**

From: citizens search, upload documents repeatedly, and chase status.

To: eligible services reach citizens, verified documents are reused with consent, and every application or grievance moves through accountable workflows.

---

# 1. Executive Summary

ServiceFormAI OS should not be built as another form builder, another government portal, or another workflow SaaS. It should be built as **infrastructure-level software for service delivery**.

Most public-service systems fail not because forms are hard to digitize, but because the service ecosystem is fragmented:

* Citizens do not know which schemes or services apply to them.
* Departments publish services in different formats.
* Citizens repeatedly upload the same identity, income, education, address, caste/category, bank, and eligibility documents.
* Local bodies, state departments, universities, boards, welfare agencies, and private partners run disconnected workflows.
* Status visibility is weak.
* Grievances sit outside the service journey instead of being treated as first-class service cases.
* Eligibility discovery is passive, search-based, and often inaccessible to low-literacy or low-bandwidth citizens.
* AI is often proposed as a magic layer, when the real need is rule-governed, consented, auditable service intelligence.

ServiceFormAI OS solves this by creating a **Service Manifest Protocol** and a **DigiLocker-first citizen journey layer**.

A producer publishes a service once using a machine-readable Service Manifest. That manifest defines the service identity, eligibility rules, jurisdiction, document requirements, DigiLocker mappings, citizen journey, form schema, workflow, API routing, notification rules, status lifecycle, grievance rules, SLA rules, output document rules, localization, accessibility, privacy, and audit requirements.

A citizen accesses the service through DigiLocker, UMANG, a state portal, a municipal app, WhatsApp, CSC/service centers, bank apps, or approved partner channels. With explicit consent, the platform checks whether verified wallet documents and profile signals indicate that the citizen may be eligible. The citizen sees understandable recommendations, shares documents only for a specific purpose, applies using prefilled forms, tracks status, responds to deficiencies, receives approvals or certificates, and can raise or track grievances.

The MVP should be narrow and sharp: **a DigiLocker Scholarship Pilot** for one scholarship or welfare scheme, one backend-less department, one workflow, document reuse, consent, application submission, acknowledgement, officer review, deficiency, resubmission, approval, notification, and output delivery.

The long-term opportunity is much larger: ServiceFormAI OS can become a national-scale, federated service delivery operating system across government schemes, municipal services, grievances, licenses, certificates, renewals, utilities, education, banking, and public-private benefit delivery.

---

# 2. Strategic Positioning

## 2.1 What ServiceFormAI OS is

ServiceFormAI OS is a **Citizen Service Intelligence Network**.

It combines:

* Citizen service feed
* Service registry
* Scheme registry
* Eligibility intelligence
* Notification intelligence
* DigiLocker document reuse
* Consent management
* Dynamic service journeys
* Service Manifest protocol
* Multi-tenant workflow backend
* Grievance management
* Jurisdiction routing
* Plugin marketplace
* API exchange
* Governance and audit

## 2.2 What it is not

It is not:

* A generic form builder
* A simple document upload portal
* A static scheme directory
* A workflow tool with government branding
* A chatbot wrapper over government websites
* A no-code builder without interoperability standards
* An AI eligibility engine that silently profiles citizens
* A centralized portal that assumes every department uses the same backend

## 2.3 Category position

**Category:** Citizen Service Intelligence Network

**Subcategory:** Federated service delivery infrastructure

**First wedge:** DigiLocker-first scholarship and welfare application OS

**Expansion path:** Schemes → certificates → municipal services → grievances → renewals → private/public-private services → API marketplace → national service intelligence layer

## 2.4 Core market thesis

Every government and large public-service ecosystem has thousands of services, but no universal service contract. The missing layer is not only a portal. The missing layer is a **machine-readable service protocol** that can power discovery, eligibility, consent, application, processing, tracking, notification, grievance, and audit across many channels and many producers.

ServiceFormAI OS becomes valuable because it is both:

1. **A product** that departments can use immediately.
2. **A protocol** that lets service ecosystems scale beyond one portal or one vendor.

---

# 3. Product Philosophy

ServiceFormAI OS is built on twelve principles.

1. **Publish once** — a producer should define a service once in a reusable Service Manifest.
2. **Discover everywhere** — services should appear across DigiLocker, state portals, municipal apps, UMANG, WhatsApp, CSCs, and partner channels.
3. **Notify the right citizen** — eligibility-aware notifications should reach citizens when action is possible and useful.
4. **Share documents once** — verified DigiLocker documents should replace repeated uploads wherever legally and technically possible.
5. **Consent every time** — no permanent blanket consent; every reuse must be service-specific, purpose-specific, data-specific, time-bound, explainable, and auditable.
6. **Apply with wallet documents** — the default application experience should be prefilled from verified sources, not manual re-entry.
7. **Process through API or workflow** — producers with APIs use exchange mode; producers without APIs use the platform workflow OS.
8. **Route to the correct government level** — central, state, district, municipality, ward, panchayat, university, bank, or private partner routing must be built into the manifest.
9. **Track every status** — citizens should never have to chase a department to know where the case is.
10. **Resolve grievances** — grievances are service journeys, not side-channel complaints.
11. **Deliver output digitally** — certificates, approvals, acknowledgements, licenses, sanctions, or benefit statuses should be digitally issued and stored where appropriate.
12. **Maintain audit, trust, and privacy** — the system must be explainable, secure, consent-led, and compliant by design.

## Product law

**Rules decide. Workflow approves. AI assists. Citizen controls consent.**

## Citizen promise

**Share once. Apply many times. Consent every time.**

## Producer promise

**Publish once. Serve everywhere. Process with accountability.**

---

# 4. Ecosystem Model

ServiceFormAI OS is designed for a federated public-service ecosystem, not a single centralized portal.

## 4.1 Actors

### Citizens

Citizens discover, apply, track, respond, receive, renew, and complain.

### Service producers

Service producers publish and operate services. They include:

* Central government ministries
* State departments
* District offices
* Municipal corporations
* Panchayats/local bodies
* Universities
* Boards
* Welfare agencies
* Public sector institutions
* Banks
* Utilities
* Hospitals
* Telecom providers
* Insurance providers
* Approved private/public-private providers

### Service consumers/channels

Channels expose services to citizens. They include:

* DigiLocker
* UMANG
* State portals
* Municipal apps
* WhatsApp bots
* CSC/service centers
* Bank apps
* University portals
* Approved citizen-service apps

### Platform operator

The platform operator governs standards, certification, access, security, audit, registry quality, plugin approvals, and ecosystem reliability.

### Officers and case workers

Officers review cases, verify documents, raise deficiencies, approve/reject, escalate, inspect, close grievances, and issue outputs.

### Developers and integrators

Developers integrate producer APIs, channel APIs, verification services, notification services, payment providers, eSign, GIS, OCR, analytics, and storage.

## 4.2 Operating model

The correct governance model is:

**Central standards, state configuration, local execution, multi-channel access.**

This avoids two bad extremes:

1. A centralized mega-portal that cannot adapt to local rules.
2. Thousands of disconnected local apps that cannot interoperate.

## 4.3 Network effects

ServiceFormAI OS improves as more actors join:

* More service manifests increase citizen coverage.
* More verified document mappings reduce repeated document work.
* More backend integrations improve status visibility.
* More channels increase distribution.
* More workflow tenants increase operational proof.
* More plugins reduce integration cost.
* More governance templates improve trust and certification speed.

---

# 5. Service Categories

ServiceFormAI OS must support four major service families from day one in the domain model, even if the MVP implements only one.

## 5.1 Government schemes

Examples:

* Scholarships
* Pensions
* Farmer benefits
* Student benefits
* Health schemes
* Housing schemes
* Employment schemes
* Skill development schemes
* Subsidies
* Welfare schemes
* Social security schemes

Common traits:

* Eligibility is rule-heavy.
* Documents are often repetitive.
* Citizens frequently do not know they qualify.
* Benefit delivery may depend on bank account, institution, district, or category validation.
* Status transparency is critical.

## 5.2 Government services

Examples:

* Birth certificate
* Death certificate
* Income certificate
* Caste/category certificate
* Domicile certificate
* Trade license
* Property mutation
* Water connection
* Sewerage connection
* Building permission
* Local permits
* Municipal services

Common traits:

* Jurisdiction matters.
* Applications often route to local offices.
* Inspections and field verification may be required.
* Certificates or approvals are output documents.
* SLA monitoring is essential.

## 5.3 Grievances

Examples:

* Streetlight complaint
* Garbage complaint
* Road repair complaint
* Water leakage complaint
* Property tax grievance
* Pension grievance
* Scheme benefit grievance
* Department service complaint

Common traits:

* Location and category routing are central.
* Evidence/photo support is often needed.
* SLA and escalation are essential.
* Citizen confirmation and reopen flows matter.
* Grievances must be linked to service quality analytics.

## 5.4 Private and public-private services

Examples:

* Bank account opening
* Loan application
* Insurance onboarding
* Telecom connection
* University admission
* Hospital registration
* Utility onboarding
* MSME onboarding
* Vendor registration
* Education loan subsidy
* Public-private welfare programs

Common traits:

* Identity and document reuse reduce onboarding friction.
* Consent and data minimization are especially important.
* Certification of private partners is required.
* Commercial incentives must not override citizen trust.

---

# 6. Citizen Service Feed

The Citizen Service Feed is the product’s citizen-facing intelligence layer. It is not a marketing feed. It is an action feed.

## 6.1 Purpose

The feed answers these questions:

* What can I apply for?
* What am I likely eligible for?
* What am I missing?
* What is pending?
* What needs action?
* What has been approved?
* What has been rejected and why?
* What benefit, certificate, license, or service is ready?
* What grievance is pending or resolved?
* What renewal is due?

## 6.2 Feed cards

### Recommended scheme card

* Scheme name
* Why this appears
* Eligibility confidence
* Required documents
* Documents already available in DigiLocker
* Missing documents
* Application deadline
* Estimated completion time
* CTA: Check eligibility

### Pending action card

* Application/grievance name
* Current status
* Action required
* Deadline
* CTA: Respond now

### Missing document card

* Document name
* Required for which service
* How to obtain/add to DigiLocker
* CTA: Add document or continue without it if allowed

### Renewal card

* Service/license/certificate name
* Expiry date
* Renewal window
* Required documents
* CTA: Renew

### Grievance status card

* Complaint category
* Location
* Assigned department/officer role
* SLA countdown
* Resolution proof if resolved
* CTA: Track, confirm, or reopen

## 6.3 Feed ranking rules

Feed priority should be based on:

1. Citizen action required
2. Deadlines and expiring benefits
3. Confirmed eligibility
4. Likely eligibility
5. Missing document blockers
6. Status changes
7. Local relevance
8. Benefit value or urgency
9. Citizen preference
10. Consent boundaries

## 6.4 Citizen-safe eligibility language

The feed must avoid overclaiming. Use:

* “You appear eligible.”
* “You may be eligible.”
* “Check eligibility in 2 minutes.”
* “You need one more document to apply.”
* “This service is not available in your district.”
* “Your application needs one correction.”

Avoid:

* “You are guaranteed this benefit.”
* “AI has decided you qualify.”
* “You have been rejected by AI.”
* “We scanned your documents automatically.”

## 6.5 Consent entry prompt

Before intelligent discovery, the system should ask:

**“Would you like to use your verified documents and profile to discover schemes and services you may be eligible for?”**

The citizen should see:

* What data will be checked
* Which service categories will be matched
* Whether results are indicative or confirmed
* How long consent lasts
* How to revoke consent
* Who can see the data
* Whether data leaves DigiLocker/platform boundary

---

# 7. Eligibility and Notification Engine

## 7.1 Eligibility engine

The Eligibility Engine evaluates citizen signals against Service Manifest rules.

### Inputs

* Citizen profile attributes
* DigiLocker verified document metadata
* Citizen-provided answers
* Jurisdiction data
* Service availability rules
* Existing application/benefit status
* Renewal dates
* Producer-defined eligibility rules
* Document availability
* Consent scope

### Rule categories

* Age
* Gender, where legally applicable
* State/district/locality
* Income level
* Student status
* Farmer status
* Disability status
* Occupation
* Caste/category, where legally applicable
* Land ownership
* Bank account status
* Existing benefit status
* Document availability
* Renewal date
* Grievance category
* Jurisdiction

### Eligibility result classes

1. **Confirmed match** — the available verified information satisfies the rule.
2. **Likely match** — evidence suggests eligibility but some confirmation is needed.
3. **Needs more information** — one or more required attributes are missing.
4. **Not eligible** — available rules indicate the citizen does not qualify.
5. **Unknown** — insufficient consent, unavailable data, or incompatible manifest.

### Explainability output

Every eligibility result must produce:

* Result class
* Rules passed
* Rules not passed
* Missing information
* Required documents
* Confidence label
* Next best action
* Non-decision disclaimer where relevant

### Decision boundary

The engine can recommend or screen. It must not silently approve or reject unless legally authorized and fully auditable. For the MVP, eligibility is advisory before submission and rule-based after submission.

## 7.2 Notification engine

The Notification Engine is service-aware, eligibility-aware, consent-aware, and action-oriented.

### Notification types

* New scheme available
* Citizen may be eligible
* Missing document needed
* Application submitted
* Acknowledgement generated
* Deficiency raised
* Resubmission required
* Payment pending
* Application approved
* Application rejected
* Benefit sanctioned
* Certificate issued
* Grievance assigned
* Grievance resolved
* Renewal due
* Document expiring
* SLA breached
* Local service alert

### Channels

* DigiLocker inbox
* SMS
* Email
* WhatsApp
* UMANG notification
* State portal inbox
* App push
* CSC/operator notification
* IVR for low digital literacy users

### Notification rules

* Notify only when the citizen can understand or take action.
* Never send sensitive details over insecure channels.
* Respect channel consent and user preference.
* Use short, local-language, action-specific messages.
* Provide a deep link into the exact next step.
* Avoid spam by grouping low-priority updates.
* Log every notification event.

### Example notification copy

**Eligibility:** “You may be eligible for the State Merit Scholarship. 3 documents are already available in your DigiLocker. Check eligibility in 2 minutes.”

**Deficiency:** “Your scholarship application needs one correction: income certificate year. Please update by 15 July.”

**Grievance:** “Your streetlight complaint has been assigned to the municipal electrical team. Expected resolution: 48 hours.”

---

# 8. Service Manifest Protocol

The Service Manifest is the core product IP. It is a machine-readable service contract that defines everything needed to discover, recommend, render, submit, process, track, notify, and resolve a service.

## 8.1 What the Service Manifest contains

* Service identity
* Producer identity
* Government level
* Jurisdiction
* Service type
* Scheme/service/grievance category
* Eligibility rules
* Required documents
* DigiLocker document mappings
* Citizen profile mappings
* Consent rules
* Notification rules
* Form schema
* Journey schema
* Workflow schema
* API schema
* Payment rules
* SLA rules
* Status lifecycle
* Grievance rules
* Output document rules
* Renewal rules
* Localization
* Accessibility
* Versioning
* Certification status
* Audit requirements

## 8.2 Schema separation

### Form Schema

Defines what data is required.

### Journey Schema

Defines how the citizen experiences the application.

### Workflow Schema

Defines how the producer processes the case.

### Eligibility Schema

Defines who may qualify.

### Notification Schema

Defines when and how the citizen is notified.

### Jurisdiction Schema

Defines where the case should be routed.

### Grievance Schema

Defines how a complaint or service issue is handled.

## 8.3 Manifest design principles

* Machine-readable, human-reviewable
* Versioned and backwards-compatible
* Certifiable before public release
* Localizable into multiple languages
* Accessible by default
* Explicit about consent and data use
* Compatible with both API and workflow backends
* Able to represent government and approved private services
* Able to express uncertainty in eligibility
* Able to support grievance and renewal lifecycles

## 8.4 JSON example: Student scholarship scheme

```json
{
  "manifestVersion": "1.0.0",
  "service": {
    "id": "scholarship.state.merit.2026",
    "name": "State Merit Scholarship 2026",
    "type": "SCHEME",
    "category": "STUDENT_BENEFIT",
    "description": "Financial assistance for eligible students pursuing higher education.",
    "producer": {
      "id": "state_welfare_department",
      "name": "State Welfare Department",
      "governmentLevel": "STATE"
    },
    "status": "ACTIVE",
    "applicationWindow": {
      "opensOn": "2026-06-01",
      "closesOn": "2026-08-31"
    }
  },
  "jurisdiction": {
    "country": "IN",
    "state": "STATE_CODE",
    "districts": ["ALL"],
    "routingRule": "route_to_student_institution_district_office"
  },
  "eligibility": {
    "resultClasses": ["CONFIRMED_MATCH", "LIKELY_MATCH", "NEEDS_MORE_INFORMATION", "NOT_ELIGIBLE", "UNKNOWN"],
    "rules": [
      {
        "id": "age_rule",
        "field": "citizen.age",
        "operator": ">=",
        "value": 16,
        "evidence": ["aadhaar_dob", "school_record_dob"]
      },
      {
        "id": "student_rule",
        "field": "citizen.education.currentEnrollmentStatus",
        "operator": "equals",
        "value": "ENROLLED",
        "evidence": ["bonafide_certificate", "institution_enrollment_api"]
      },
      {
        "id": "income_rule",
        "field": "household.annualIncome",
        "operator": "<=",
        "value": 250000,
        "evidence": ["income_certificate"]
      }
    ],
    "citizenSafeMessages": {
      "LIKELY_MATCH": "You may be eligible for this scholarship.",
      "NEEDS_MORE_INFORMATION": "We need one more detail to check your eligibility."
    }
  },
  "documents": {
    "required": [
      {
        "id": "identity_proof",
        "name": "Identity Proof",
        "digilockerMappings": ["AADHAAR", "PAN"],
        "required": true
      },
      {
        "id": "income_certificate",
        "name": "Income Certificate",
        "digilockerMappings": ["INCOME_CERTIFICATE"],
        "required": true,
        "validityRule": "issued_within_12_months"
      },
      {
        "id": "student_bonafide",
        "name": "Bonafide Certificate",
        "digilockerMappings": ["EDU_BONAFIDE"],
        "required": true
      },
      {
        "id": "bank_account",
        "name": "Bank Account Details",
        "digilockerMappings": ["BANK_PASSBOOK", "BANK_ACCOUNT_VERIFICATION"],
        "required": true
      }
    ]
  },
  "consent": {
    "purpose": "Check eligibility and submit scholarship application",
    "dataScopes": ["identity", "date_of_birth", "education", "income", "bank_account"],
    "timeBound": true,
    "durationDays": 90,
    "revocable": true,
    "citizenExplanation": "Your documents will be used only for this scholarship application unless you consent again."
  },
  "formSchema": {
    "sections": [
      { "id": "profile", "title": "Student details", "prefill": true },
      { "id": "education", "title": "Education details", "prefill": true },
      { "id": "income", "title": "Income details", "prefill": true },
      { "id": "bank", "title": "Bank details", "prefill": true },
      { "id": "review", "title": "Review and submit" }
    ]
  },
  "journeySchema": {
    "steps": [
      "SERVICE_INTRO",
      "ELIGIBILITY_CHECK",
      "CONSENT",
      "DOCUMENT_REUSE",
      "GUIDED_FORM",
      "REVIEW",
      "SUBMIT",
      "ACKNOWLEDGEMENT",
      "STATUS_TRACKING"
    ]
  },
  "workflowSchema": {
    "mode": "WORKFLOW",
    "stages": [
      { "id": "submitted", "label": "Submitted", "actor": "SYSTEM" },
      { "id": "document_verification", "label": "Document Verification", "actor": "CASE_WORKER" },
      { "id": "deficiency", "label": "Deficiency Raised", "actor": "CASE_WORKER", "optional": true },
      { "id": "resubmitted", "label": "Resubmitted", "actor": "CITIZEN", "optional": true },
      { "id": "approval", "label": "Approval", "actor": "OFFICER" },
      { "id": "benefit_sanctioned", "label": "Benefit Sanctioned", "actor": "SYSTEM" }
    ]
  },
  "statusLifecycle": [
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "DEFICIENCY_RAISED",
    "RESUBMITTED",
    "APPROVED",
    "REJECTED",
    "BENEFIT_SANCTIONED",
    "CLOSED"
  ],
  "notifications": {
    "events": [
      "APPLICATION_SUBMITTED",
      "DEFICIENCY_RAISED",
      "APPLICATION_APPROVED",
      "APPLICATION_REJECTED",
      "BENEFIT_SANCTIONED"
    ],
    "channels": ["DIGILOCKER_INBOX", "SMS", "EMAIL"]
  },
  "sla": {
    "reviewDays": 15,
    "deficiencyResponseDays": 10,
    "approvalDays": 30
  },
  "output": {
    "type": "BENEFIT_SANCTION_ORDER",
    "deliverTo": ["DIGILOCKER", "CITIZEN_SERVICE_FEED"]
  },
  "audit": {
    "required": true,
    "events": ["CONSENT_GRANTED", "DOCUMENT_ACCESSED", "APPLICATION_SUBMITTED", "OFFICER_ACTION", "STATUS_CHANGED"]
  }
}
```

## 8.5 JSON example: Municipal streetlight grievance

```json
{
  "manifestVersion": "1.0.0",
  "service": {
    "id": "municipality.streetlight.grievance",
    "name": "Streetlight Complaint",
    "type": "GRIEVANCE",
    "category": "MUNICIPAL_SERVICE",
    "description": "Report a non-working or unsafe streetlight.",
    "producer": {
      "id": "city_municipal_corporation",
      "name": "City Municipal Corporation",
      "governmentLevel": "LOCAL"
    },
    "status": "ACTIVE"
  },
  "jurisdiction": {
    "country": "IN",
    "state": "STATE_CODE",
    "municipality": "CITY_CODE",
    "routingRule": "route_by_gps_or_ward",
    "wardMappingRequired": true
  },
  "eligibility": {
    "rules": [
      {
        "id": "location_rule",
        "field": "grievance.location.municipality",
        "operator": "equals",
        "value": "CITY_CODE"
      }
    ],
    "citizenSafeMessages": {
      "CONFIRMED_MATCH": "This complaint can be handled by your municipality.",
      "NOT_ELIGIBLE": "This location is outside the selected municipality."
    }
  },
  "documents": {
    "required": [],
    "optional": [
      {
        "id": "photo_evidence",
        "name": "Photo of streetlight",
        "type": "IMAGE",
        "required": false
      }
    ]
  },
  "consent": {
    "purpose": "Register and resolve your streetlight complaint",
    "dataScopes": ["name", "mobile", "location", "photo_evidence"],
    "timeBound": true,
    "durationDays": 60,
    "citizenExplanation": "Your contact and location will be used only to resolve this complaint."
  },
  "formSchema": {
    "sections": [
      { "id": "location", "title": "Complaint location", "fields": ["gps", "address", "ward"] },
      { "id": "issue", "title": "Issue details", "fields": ["issueType", "description", "photo"] },
      { "id": "contact", "title": "Contact details", "prefill": true },
      { "id": "review", "title": "Review and submit" }
    ]
  },
  "journeySchema": {
    "steps": [
      "SERVICE_INTRO",
      "LOCATION_CAPTURE",
      "ISSUE_DETAILS",
      "OPTIONAL_EVIDENCE_UPLOAD",
      "REVIEW",
      "SUBMIT",
      "TRACK_GRIEVANCE"
    ]
  },
  "grievanceSchema": {
    "category": "STREETLIGHT",
    "assignmentRule": "ward_and_category",
    "requiresCitizenConfirmation": true,
    "reopenAllowed": true,
    "reopenWindowDays": 7,
    "resolutionProofRequired": true
  },
  "workflowSchema": {
    "mode": "WORKFLOW",
    "stages": [
      { "id": "submitted", "label": "Submitted", "actor": "CITIZEN" },
      { "id": "assigned", "label": "Assigned", "actor": "SYSTEM" },
      { "id": "in_progress", "label": "In Progress", "actor": "MUNICIPAL_TEAM" },
      { "id": "resolved", "label": "Resolved", "actor": "MUNICIPAL_TEAM" },
      { "id": "citizen_confirmed", "label": "Citizen Confirmed", "actor": "CITIZEN", "optional": true },
      { "id": "closed", "label": "Closed", "actor": "SYSTEM" }
    ]
  },
  "statusLifecycle": [
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CITIZEN_CONFIRMED",
    "REOPENED",
    "ESCALATED",
    "CLOSED"
  ],
  "notifications": {
    "events": ["GRIEVANCE_SUBMITTED", "GRIEVANCE_ASSIGNED", "GRIEVANCE_RESOLVED", "REOPEN_WINDOW_EXPIRING"],
    "channels": ["SMS", "WHATSAPP", "MUNICIPAL_APP"]
  },
  "sla": {
    "assignmentHours": 4,
    "resolutionHours": 48,
    "escalationAfterHours": 72
  },
  "audit": {
    "required": true,
    "events": ["GRIEVANCE_SUBMITTED", "LOCATION_CAPTURED", "ASSIGNED", "OFFICER_ACTION", "RESOLUTION_PROOF_UPLOADED", "CITIZEN_CONFIRMED"]
  }
}
```

## 8.6 JSON example: Bank account opening service

```json
{
  "manifestVersion": "1.0.0",
  "service": {
    "id": "bank.account.opening.basic_savings",
    "name": "Basic Savings Account Opening",
    "type": "PRIVATE_PUBLIC_SERVICE",
    "category": "BANKING_ONBOARDING",
    "description": "Open a basic savings account using verified documents with consent.",
    "producer": {
      "id": "approved_bank_partner",
      "name": "Approved Bank Partner",
      "governmentLevel": "PRIVATE_CERTIFIED_PARTNER"
    },
    "status": "ACTIVE"
  },
  "jurisdiction": {
    "country": "IN",
    "states": ["ALL"],
    "routingRule": "route_to_bank_branch_or_digital_kyc_queue"
  },
  "eligibility": {
    "rules": [
      {
        "id": "age_rule",
        "field": "citizen.age",
        "operator": ">=",
        "value": 18,
        "evidence": ["aadhaar_dob", "pan_dob"]
      },
      {
        "id": "identity_document_rule",
        "field": "documents.identity.available",
        "operator": "equals",
        "value": true
      },
      {
        "id": "address_document_rule",
        "field": "documents.address.available",
        "operator": "equals",
        "value": true
      }
    ],
    "citizenSafeMessages": {
      "LIKELY_MATCH": "You may be able to open this account using verified documents.",
      "NEEDS_MORE_INFORMATION": "The bank needs one more detail to continue."
    }
  },
  "documents": {
    "required": [
      {
        "id": "identity_proof",
        "name": "Identity Proof",
        "digilockerMappings": ["AADHAAR", "PAN"],
        "required": true
      },
      {
        "id": "address_proof",
        "name": "Address Proof",
        "digilockerMappings": ["AADHAAR", "UTILITY_BILL", "DRIVING_LICENSE"],
        "required": true
      }
    ],
    "optional": [
      {
        "id": "income_proof",
        "name": "Income Proof",
        "digilockerMappings": ["INCOME_CERTIFICATE", "SALARY_SLIP"],
        "required": false
      }
    ]
  },
  "consent": {
    "purpose": "Share verified documents with the bank for account opening",
    "dataScopes": ["identity", "address", "date_of_birth", "mobile", "email"],
    "timeBound": true,
    "durationDays": 30,
    "revocable": true,
    "citizenExplanation": "Your selected documents will be shared with this bank only for account opening."
  },
  "formSchema": {
    "sections": [
      { "id": "profile", "title": "Personal details", "prefill": true },
      { "id": "contact", "title": "Contact details", "prefill": true },
      { "id": "nominee", "title": "Nominee details", "prefill": false },
      { "id": "declarations", "title": "Declarations" },
      { "id": "review", "title": "Review and submit" }
    ]
  },
  "journeySchema": {
    "steps": [
      "SERVICE_INTRO",
      "PARTNER_DISCLOSURE",
      "CONSENT",
      "DOCUMENT_REUSE",
      "GUIDED_FORM",
      "REVIEW",
      "SUBMIT_TO_BANK",
      "STATUS_TRACKING"
    ]
  },
  "apiSchema": {
    "mode": "EXCHANGE",
    "submissionEndpoint": "partner_bank.accountOpening.submit",
    "statusEndpoint": "partner_bank.accountOpening.status",
    "callbackEvents": ["KYC_PENDING", "APPROVED", "REJECTED", "ACCOUNT_OPENED"]
  },
  "statusLifecycle": [
    "DRAFT",
    "SUBMITTED_TO_BANK",
    "KYC_PENDING",
    "APPROVED",
    "REJECTED",
    "ACCOUNT_OPENED",
    "CLOSED"
  ],
  "notifications": {
    "events": ["SUBMITTED_TO_BANK", "KYC_PENDING", "ACCOUNT_OPENED", "REJECTED"],
    "channels": ["DIGILOCKER_INBOX", "SMS", "EMAIL"]
  },
  "audit": {
    "required": true,
    "events": ["PARTNER_DISCLOSURE_VIEWED", "CONSENT_GRANTED", "DOCUMENT_SHARED", "APPLICATION_SUBMITTED", "BANK_STATUS_UPDATED"]
  },
  "certification": {
    "partnerCertified": true,
    "privacyReview": "APPROVED",
    "securityReview": "APPROVED"
  }
}
```

---

# 9. Product Modules

## 9.1 Citizen Service Feed

Shows:

* Recommended schemes
* Eligible services
* Pending actions
* Missing documents
* Grievances
* Renewals
* Benefits
* Application status
* Consent history

Core capabilities:

* Eligibility-aware service cards
* Consent-aware recommendations
* Deadline ranking
* Missing document detection
* Status timeline
* Multilingual explanations
* Accessibility-first cards
* Assisted mode for CSC operators

## 9.2 Service Registry

Catalog of:

* Schemes
* Services
* Grievances
* Renewals
* Certificates
* Licenses
* Benefits
* Private/public-private services

Core capabilities:

* Service search
* Manifest versioning
* Producer ownership
* Jurisdiction mapping
* Publication status
* Certification status
* Dependency mapping
* API/workflow mode mapping

## 9.3 Service Manifest Studio

Producer tool to publish services.

Includes:

* Eligibility builder
* Form builder
* Journey builder
* Workflow builder
* Notification rules
* Jurisdiction routing
* Versioning
* Certification checklist
* Localization editor
* Accessibility checker
* Document mapping editor
* Consent language generator
* Test citizen simulator

The Manifest Studio should be opinionated. It should guide producers toward good service design, not merely let them create bad digital forms faster.

## 9.4 Citizen Journey Renderer

Dynamic frontend engine that renders:

* Service intro
* Eligibility check
* Consent screen
* Document reuse screen
* Guided form
* Review
* Submission
* Acknowledgement
* Status tracking
* Deficiency resubmission

Renderer requirements:

* Mobile-first
* Low-bandwidth friendly
* Local-language support
* Screen-reader compatible
* Save and resume
* Assisted-service mode
* Error prevention
* Step-by-step guidance
* Clear status timeline

## 9.5 Eligibility and Notification Engine

Determines:

* Who may be eligible
* What document is missing
* What service is open
* What renewal is due
* What application needs action
* What grievance has changed status

Core components:

* Rule evaluator
* Evidence mapper
* Consent gate
* Recommendation ranker
* Notification scheduler
* Channel preference manager
* Explainability generator
* Audit logger

## 9.6 Tenant Workflow OS

Backend for departments, municipalities, universities, boards, welfare agencies, and certified partners.

Includes:

* Application inbox
* Grievance inbox
* Officer queues
* Role management
* Workflow builder
* SLA tracking
* Deficiency handling
* Approval/rejection
* Certificate generation
* MIS dashboard
* Audit log

## 9.7 Plugin Marketplace

Includes:

* DigiLocker
* SSO
* SMS
* Email
* WhatsApp
* Payment gateway
* eSign
* OCR
* AI assistant
* PAN verification
* Bank verification
* GIS/location
* IVR
* Storage
* Analytics

The marketplace should be certification-led, not open chaos. Every plugin needs security, privacy, reliability, and data-use metadata.

## 9.8 Governance Console

Handles:

* Producer certification
* Consumer/channel certification
* Plugin certification
* Service Manifest certification
* Privacy review
* Security review
* Audit monitoring
* SLA monitoring
* Policy compliance
* Regulatory reporting

---

# 10. MVP Product Definition

## MVP name

**DigiLocker Scholarship Pilot**

## MVP thesis

If ServiceFormAI OS can prove that a student can discover a scholarship, check eligibility, consent to reuse DigiLocker documents, submit a prefilled application, receive acknowledgement, track status, fix a deficiency, and receive approval through a backend-less department workflow, then the platform proves its core infrastructure value.

## MVP service

One student scholarship or welfare benefit.

## MVP producer

One backend-less welfare department, university board, or scholarship authority.

## MVP user personas

### Citizen/student

Wants to know whether they are eligible, apply quickly, avoid repeated uploads, and track status.

### Parent/guardian

May assist with income, bank, and household details.

### Department case worker

Checks documents, raises deficiencies, and recommends approval/rejection.

### Department officer

Approves/rejects and monitors SLA.

### Admin

Configures service manifest, workflow, notification templates, and reports.

## MVP citizen journey

1. Student enters through DigiLocker-style login.
2. Student sees a recommended scholarship card.
3. Student selects “Check eligibility.”
4. Platform explains what data will be checked.
5. Student grants service-specific consent.
6. Platform checks document availability and basic eligibility.
7. Student sees result: “You may be eligible.”
8. Student sees required documents: identity, income certificate, bonafide certificate, bank proof.
9. Available DigiLocker documents are shown for reuse.
10. Missing document is requested or marked for manual upload if allowed.
11. Form is prefilled.
12. Student reviews and submits.
13. Acknowledgement is generated.
14. Case appears in officer queue.
15. Case worker raises a deficiency.
16. Student receives notification.
17. Student corrects/resubmits.
18. Officer approves.
19. Student receives approval/benefit status.
20. Output is available in service feed and, where possible, DigiLocker.

## MVP backend journey

1. Admin publishes scholarship manifest.
2. Workflow is configured with review, deficiency, resubmission, approval, rejection.
3. Officer roles are created.
4. Applications arrive in queue.
5. Officer views citizen-submitted data and document metadata.
6. Officer verifies documents.
7. Officer raises deficiency with structured reason.
8. Citizen resubmits.
9. Officer approves/rejects.
10. MIS dashboard updates.
11. Audit log records all actions.

## MVP must-have capabilities

* DigiLocker-style login simulation or integration-ready flow
* Citizen profile
* Consent screen
* Document mapping and reuse flow
* Scholarship service manifest
* Eligibility rules
* Dynamic form renderer
* Application submission
* Acknowledgement number
* Officer queue
* Document review
* Deficiency workflow
* Citizen resubmission
* Approval/rejection
* Status timeline
* Notification templates
* Audit log
* Basic admin console
* Basic MIS dashboard

## MVP exclusions

* Full national service registry
* Full plugin marketplace
* Real AI decisioning
* Dozens of services
* Complex federal dashboards
* Full payment marketplace
* Real-time integration with every department
* Complex municipal rollout
* Advanced fraud detection
* Multi-country deployment
* Full private partner marketplace
* Real-time bank disbursement reconciliation

## MVP success criteria

* Application completion time reduced by at least 50% versus manual upload flow.
* At least 70% of required fields prefilled or reusable where verified documents exist.
* Citizens can understand consent before submitting.
* Officers can process applications without external spreadsheets.
* Every application has a visible status timeline.
* Deficiency and resubmission work end-to-end.
* Audit trail captures consent, submission, document access, and officer actions.
* MVP can add a second scholarship by creating a new manifest, not rebuilding the product.

---

# 11. Federal and Local Government Model

## 11.1 Central/federal layer

Responsible for:

* Service Manifest standard
* Security standards
* Consent standards
* API standards
* National service registry protocol
* Plugin certification
* Audit standards
* Interoperability rules
* National dashboards
* Cross-government reporting

The central layer should define standards, not own every workflow.

## 11.2 State layer

Responsible for:

* State schemes
* State service catalogs
* State SSO integrations
* State document repositories
* Local language configuration
* State workflows
* Regional eligibility rules
* Department onboarding

The state layer should configure and operate services according to local policy.

## 11.3 District layer

Responsible for:

* District-level routing
* Verification queues
* Local officer assignment
* Escalations
* Field verification
* District dashboards
* SLA supervision

## 11.4 Local government layer

Responsible for:

* Municipal services
* Panchayat services
* Local grievances
* Local licenses
* Local inspections
* Local certificates
* Ward-level routing
* SLA fulfilment

## 11.5 Consumer channel layer

Includes:

* DigiLocker
* UMANG
* State portals
* Municipal apps
* WhatsApp bots
* CSC/service centers
* Bank apps
* Private citizen-service apps

## 11.6 Governance model

The platform should support:

* Central standards authority
* State administrators
* Local tenant administrators
* Producer owners
* Channel partners
* Certified plugin providers
* Privacy reviewers
* Security reviewers
* Auditors

## 11.7 Multi-tenancy model

Each tenant gets:

* Tenant profile
* Department hierarchy
* Offices
* Jurisdiction
* Users
* Roles
* Permissions
* Service catalog
* Application queues
* Workflow builder
* Officer dashboard
* SLA dashboard
* Grievance dashboard
* Notification templates
* Certificate templates
* Payment settings
* Plugin settings
* Audit logs
* MIS reports

---

# 12. Grievance Model

Grievances should be treated as first-class service types, not separate complaint tickets.

## 12.1 Why grievances matter

A grievance is often the clearest signal that the service delivery system is failing. If grievances are not part of the same service intelligence network, the government cannot close the loop between service promise, delivery quality, citizen experience, and accountability.

## 12.2 Grievance manifest fields

A grievance Service Manifest should include:

* Grievance category
* Service linkage, if applicable
* Location requirement
* Evidence/photo requirement
* Citizen identity requirement
* Anonymous option, where legally allowed
* Jurisdiction routing
* Ward/office assignment
* Officer role
* SLA
* Escalation rule
* Citizen notification rule
* Resolution proof
* Reopen rule
* Closure rule
* Audit trail

## 12.3 Standard grievance lifecycle

**SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → CITIZEN_CONFIRMED → CLOSED**

Alternative lifecycle:

**SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → REOPENED → ESCALATED → CLOSED**

## 12.4 Municipality Tenant Pack

Templates:

* Birth certificate
* Death certificate
* Trade license
* Property tax grievance
* Water connection
* Sewerage connection
* Streetlight complaint
* Garbage complaint
* Road repair complaint
* Building permission
* Local event permission
* Shop license
* Hawker license

## 12.5 Municipal workflow capabilities

* Ward routing
* GIS/map view
* Evidence/photo upload
* Field team assignment
* SLA countdown
* Escalation queue
* Resolution proof upload
* Citizen confirmation
* Reopen handling
* Public works dashboard
* Category analytics

---

# 13. Architecture

## 13.1 Eight-layer architecture

### 1. Citizen Access Layer

Channels:

* DigiLocker
* UMANG
* State portal
* Municipal app
* WhatsApp
* CSC/service centers
* Partner apps

Responsibilities:

* Authentication initiation
* Service discovery
* Citizen journey rendering
* Notifications
* Assisted access

### 2. Identity and Wallet Layer

Components:

* SSO
* DigiLocker integration
* Document wallet connector
* Citizen profile
* Consent manager
* Data minimization engine

Responsibilities:

* Identity verification
* Document access with consent
* Consent lifecycle
* Profile prefill
* Output delivery

### 3. Service Intelligence Layer

Components:

* Service registry
* Manifest registry
* Eligibility engine
* Recommendation engine
* Feed engine
* Renewal engine

Responsibilities:

* Service discovery
* Eligibility matching
* Service ranking
* Missing document detection
* Feed generation

### 4. Form and Journey Layer

Components:

* Dynamic form renderer
* Journey renderer
* Validation engine
* Prefill engine
* Accessibility layer
* Localization engine

Responsibilities:

* Guided application
* Step rendering
* Review and submit
* Deficiency resubmission

### 5. Submission and Case Layer

Components:

* Application service
* Grievance service
* Renewal service
* Acknowledgement service
* Status lifecycle service

Responsibilities:

* Case creation
* Submission records
* Status tracking
* Acknowledgements
* Case history

### 6. Workflow and Fulfilment Layer

Components:

* Tenant workflow OS
* Officer queues
* Role and permission service
* SLA service
* Deficiency service
* Approval/rejection service
* Certificate/output generator

Responsibilities:

* Backend-less producer operations
* Department workflow
* Approvals
* Fulfilment
* SLA tracking

### 7. Integration and Plugin Layer

Components:

* API gateway
* Webhook service
* Plugin registry
* Payment connector
* SMS/email/WhatsApp connectors
* eSign
* PAN/bank verification
* GIS
* OCR
* Analytics

Responsibilities:

* External system integration
* Plugin orchestration
* API exchange mode
* Hybrid workflow support

### 8. Governance and Trust Layer

Components:

* Audit log
* Consent audit
* Security policy engine
* Certification workflows
* Privacy review
* Compliance reports
* Observability
* Data retention manager

Responsibilities:

* Trust and accountability
* Certification
* Auditability
* Regulatory compliance
* Incident monitoring

## 13.2 MVP architecture recommendation

Build the MVP as a **modular monolith with clear future service boundaries**.

Why:

* Faster to build and debug.
* Easier to maintain consistent domain logic.
* Avoids premature distributed-system complexity.
* Supports clear future extraction into services.

Suggested modules inside the monolith:

* Auth/Profile module
* Consent module
* Manifest module
* Eligibility module
* Form/Journey module
* Application/Case module
* Workflow module
* Notification module
* Audit module
* Admin/Tenant module

Future extractable services:

* Manifest Registry Service
* Eligibility Service
* Consent Service
* Notification Service
* Workflow Service
* Plugin Gateway
* Audit Service

## 13.3 Backend modes

### Mode 1: Exchange Mode

Producer has backend APIs.

Platform handles:

* Service discovery
* Dynamic form rendering
* Consent
* Document reuse
* Submission gateway
* API routing
* Status bridge
* Notifications
* Audit

### Mode 2: Workflow Mode

Producer has no backend.

Platform provides:

* Multi-tenant application database
* Tenant workspace
* Workflow engine
* User management
* Role management
* Officer queue
* Verification
* Approval/rejection
* Deficiency
* Resubmission
* SLA
* Notifications
* Certificate generation
* Audit
* Dashboards

### Mode 3: Hybrid Mode

Some parts are handled by APIs, some by workflow, some by plugins.

Example:

* Form handled by platform
* Documents from DigiLocker
* Payment through treasury
* Verification through external API
* Final certificate from department backend
* Notifications through tenant provider

---

# 14. Data Model

## 14.1 Core entities

### Citizen

* citizen_id
* identity_provider_id
* name
* date_of_birth
* contact details
* preferred language
* accessibility preferences
* consent preferences
* linked document references

### Consent Record

* consent_id
* citizen_id
* service_id
* purpose
* data_scopes
* document_refs
* granted_at
* expires_at
* revoked_at
* consent_text_version
* channel
* audit_hash

### Service Manifest

* manifest_id
* service_id
* version
* producer_id
* status
* schema_json
* certification_status
* published_at
* effective_from
* effective_to

### Service

* service_id
* name
* type
* category
* producer_id
* government_level
* jurisdiction
* status
* application_window

### Producer/Tenant

* tenant_id
* name
* type
* government_level
* jurisdiction
* admin_users
* certification_status
* plugin_settings

### Application/Case

* case_id
* citizen_id
* service_id
* manifest_version
* status
* submitted_at
* current_stage
* assigned_office
* assigned_role
* acknowledgement_number
* sla_deadline

### Case Data

* case_id
* form_data_json
* prefill_sources
* document_refs
* validation_status
* deficiency_status

### Workflow Instance

* workflow_instance_id
* case_id
* workflow_version
* current_stage
* stage_history
* assigned_users
* escalations

### Officer Action

* action_id
* case_id
* officer_id
* action_type
* remarks
* structured_reason
* created_at
* attachment_refs

### Grievance

* grievance_id
* citizen_id
* category
* location
* ward
* status
* assigned_team
* resolution_proof
* reopen_count

### Notification

* notification_id
* citizen_id
* service_id
* case_id
* event_type
* channel
* template_id
* delivery_status
* sent_at

### Audit Event

* audit_id
* actor_type
* actor_id
* event_type
* entity_type
* entity_id
* timestamp
* metadata
* hash

## 14.2 Data design rules

* Store references to DigiLocker documents where possible, not unnecessary copies.
* Separate document metadata from document content.
* Maintain consent scope for every document access.
* Keep immutable audit logs.
* Version every manifest.
* Keep application data linked to manifest version used at submission time.
* Keep officer actions structured, not only free text.
* Keep jurisdiction routing as a first-class data object.
* Keep citizen-facing status separate from internal workflow state where needed.

---

# 15. Security, Privacy, and Trust

## 15.1 Trust principles

* Consent is not a checkbox; it is a contract.
* Data minimization is a product feature.
* Every document access must be explainable.
* Every recommendation must disclose why it appeared.
* Every officer action must be auditable.
* Every partner must be certified.
* AI must never become an invisible authority.

## 15.2 Consent requirements

Consent must be:

* Service-specific
* Purpose-specific
* Data-specific
* Time-bound
* Revocable where legally permitted
* Auditable
* Explainable in simple language

## 15.3 Privacy controls

* Purpose limitation
* Data minimization
* Field-level access control
* Role-based access control
* Attribute-based access control for sensitive fields
* Document access logging
* Retention policies
* Consent expiry
* Consent revocation
* Partner data-use agreements
* Privacy impact assessment for certified manifests

## 15.4 Security controls

* Strong authentication
* Tenant isolation
* Encryption in transit
* Encryption at rest
* Secrets management
* Audit logs
* API rate limiting
* Webhook signature verification
* Plugin sandboxing where possible
* Access review
* Incident response workflow
* Vulnerability disclosure process
* Secure software supply chain

## 15.5 Citizen trust UI

Every citizen should be able to see:

* What data was used
* Which documents were shared
* With whom they were shared
* For what purpose
* When consent expires
* How to revoke consent
* What status changed
* Which department/officer role handled the case
* Why a deficiency or rejection happened

---

# 16. AI Capabilities

AI is an assistant layer, not an uncontrolled decision-maker.

## 16.1 AI can help with

* Scheme discovery
* Eligibility explanation
* Missing document detection
* Form simplification
* Multilingual guidance
* Citizen assistant
* Officer summarization
* Grievance classification
* Fraud anomaly detection
* SLA risk prediction
* Service recommendation
* Policy-to-Service-Manifest generation
* Form-field mapping
* Workflow recommendation

## 16.2 AI must not

* Silently scan citizen data without consent
* Approve or reject citizens without rule authority and audit
* Hide reasons for recommendations
* Make sensitive inferences beyond legal scope
* Replace official eligibility rules
* Create dark patterns for data sharing
* Send sensitive data to uncertified models or vendors

## 16.3 AI governance model

* Rules remain source of truth.
* Human officers remain accountable for workflow decisions.
* AI outputs are recommendations or summaries.
* Every AI action is logged.
* Sensitive AI use cases require policy approval.
* Citizen-facing AI explanations must be simple and challengeable.

## 16.4 MVP AI scope

In MVP, avoid real AI decisioning. Use AI only for:

* Plain-language guidance copy
* Officer summary draft
* Optional document checklist explanation
* Admin-side manifest drafting assistant, if clearly labeled as draft

---

# 17. UX Principles

## 17.1 Citizen UX principles

1. **No dead ends** — every screen should tell the citizen what to do next.
2. **Explain why** — every recommended service should explain why it appears.
3. **Consent in plain language** — no legal-only consent screens.
4. **Show document reuse clearly** — citizens must see which DigiLocker documents will be used.
5. **Progressive disclosure** — do not overload citizens with all rules upfront.
6. **Mobile-first** — assume the phone is the primary device.
7. **Low-literacy friendly** — use simple copy, icons, audio/assisted modes later.
8. **Local language ready** — every manifest and journey should support localization.
9. **Accessible by default** — screen reader, keyboard navigation, contrast, readable errors.
10. **Status is a timeline** — never show only “under process.”

## 17.2 Officer UX principles

1. Queue clarity over dashboard clutter.
2. Structured deficiency reasons.
3. One-click view of submitted data and document evidence.
4. SLA visibility in every queue.
5. Batch actions only where safe.
6. Clear escalation paths.
7. Audit without extra work.
8. Role-specific views.
9. Decision templates.
10. Minimal context switching.

## 17.3 Admin UX principles

1. Manifest creation should feel like guided service design.
2. Certification checklist should be built into publishing.
3. Test citizen simulation before launch.
4. Version changes should be visible and reversible.
5. Localization should be part of publishing, not an afterthought.
6. Accessibility warnings should be automatic.
7. Workflow and form should be visually connected.
8. Data fields should map to document sources.
9. Consent text should be generated from actual data scopes.
10. Publishing should require governance approvals where needed.

---

# 18. Business and Governance Model

## 18.1 Business model options

### Government SaaS subscription

Charge state departments, municipalities, boards, and agencies per tenant, service volume, or module.

### Platform licensing

License the platform to a state or national operator.

### Managed service model

Operate onboarding, manifest creation, workflow setup, and support for departments.

### Transaction/service volume model

Charge per application, grievance, notification, or processed workflow where procurement allows.

### Certified partner marketplace

Charge certified private/public-private partners for verified onboarding, API access, or service publication, with strict citizen-protection rules.

### Implementation and integration revenue

Charge for integrations, training, data migration, and custom tenant deployment.

## 18.2 Recommended starting model

For early GTM:

1. Pilot implementation fee
2. Annual platform subscription for department/tenant
3. Usage-based notification and storage pass-through
4. Paid expansion to additional services
5. Optional managed onboarding package

Avoid early dependence on private-service monetization. Trust comes first.

## 18.3 Governance model

Create a multi-level governance framework:

* Platform operator
* Government standards board
* State administrators
* Local tenant owners
* Certification reviewers
* Privacy/security reviewers
* Plugin approval committee
* Citizen grievance escalation authority

## 18.4 Procurement positioning

Position as:

* Service delivery modernization platform
* DigiLocker-first application and workflow OS
* Scheme and service intelligence layer
* Municipal service and grievance OS
* Interoperability and consent infrastructure

Do not position as:

* “AI form builder”
* “Chatbot for schemes”
* “Low-code portal”

---

# 19. Roadmap

## Phase 0: Product foundation

* Product definition
* Service Manifest v0.1
* Domain model
* MVP UX prototype
* Architecture blueprint
* Security/privacy baseline
* Pilot partner identification

## Phase 1: DigiLocker Scholarship Pilot

* DigiLocker-style login and consent flow
* Scholarship manifest
* Eligibility check
* Document reuse
* Dynamic form renderer
* Application submission
* Officer workflow
* Deficiency/resubmission
* Approval/rejection
* Notifications
* Audit log
* Basic dashboard

## Phase 2: Multi-service welfare expansion

* Add 5–10 schemes
* Add renewal support
* Add service feed ranking
* Add localized journeys
* Add stronger MIS dashboard
* Add manifest versioning
* Add producer admin tools

## Phase 3: Municipality Pack

* Streetlight grievance
* Garbage complaint
* Water connection
* Trade license
* Birth/death certificate templates
* Ward routing
* GIS integration
* SLA escalation
* Resolution proof
* Citizen confirmation/reopen

## Phase 4: API exchange mode

* Producer API gateway
* Submission API bridge
* Status API bridge
* Webhooks
* External verification plugins
* Output document delivery

## Phase 5: Governance and marketplace

* Plugin certification
* Partner certification
* Channel certification
* Governance console
* Privacy review workflow
* Security review workflow
* National/state dashboards

## Phase 6: Citizen Service Intelligence Network

* Multi-channel service discovery
* Cross-service recommendations
* Consent-led eligibility feed
* Renewals intelligence
* Benefit gap detection
* Advanced analytics
* AI-assisted manifest generation
* Ecosystem protocol adoption

---

# 20. Comparison With Global Platforms

## 20.1 GOV.UK

GOV.UK is a global benchmark for simple, accessible, service-oriented government design. GOV.UK One Login is moving the UK toward shared identity across services, and GOV.UK Forms helps departments create accessible online forms.

**What to learn:**

* Simple language
* Accessibility discipline
* Government-wide design consistency
* Identity reuse
* Form standardization

**Where ServiceFormAI OS should go further:**

* Consent-led DigiLocker document reuse
* Eligibility-aware citizen service feed
* Machine-readable Service Manifest Protocol
* Workflow backend for backend-less departments
* Federal/state/local routing
* Grievance as first-class service type

## 20.2 Estonia e-government and X-Road

Estonia’s strength is secure interoperability between government systems and citizen-facing digital services.

**What to learn:**

* Interoperability as infrastructure
* Distributed systems working through standards
* Secure data exchange
* Citizen trust in digital public services

**Where ServiceFormAI OS should go further for India-like federal contexts:**

* Multi-level federal service routing
* DigiLocker document-wallet-first journeys
* Backend-less department workflow OS
* Municipal service/grievance templates
* Consent-led recommendation feed

## 20.3 Singapore GoBusiness

Singapore GoBusiness is strong for business services, licensing, and guided government interactions.

**What to learn:**

* Service bundles by user intent
* Business-friendly licensing journeys
* Guided application and renewal flows
* Practical cross-agency service access

**Where ServiceFormAI OS should go further:**

* Citizen welfare and municipal use cases
* Eligibility recommendation across schemes
* Public-private service publishing through manifests
* DigiLocker-style reusable documents
* Tenant workflow OS for agencies without mature backends

## 20.4 DigiLocker

DigiLocker is a powerful identity/document wallet and verified document infrastructure.

**What to learn:**

* Document wallet as public infrastructure
* Verified document reuse
* Issuer/requester ecosystem
* Citizen-controlled document access

**Where ServiceFormAI OS complements DigiLocker:**

* Turns documents into completed service journeys
* Adds Service Manifest Protocol
* Adds eligibility intelligence
* Adds producer workflow OS
* Adds grievance and status lifecycle
* Adds cross-channel service discovery

## 20.5 Unique ServiceFormAI OS position

ServiceFormAI OS should combine:

* GOV.UK-quality service design
* Estonia-style interoperability thinking
* Singapore-style guided service journeys
* DigiLocker-first document reuse
* India-scale federal and municipal workflow depth

Its unique strategic position is:

**The missing service intelligence and workflow layer between citizen document wallets, service producers, and multi-channel public-service delivery.**

---

# 21. Metrics

## 21.1 Citizen metrics

* Eligibility check completion rate
* Application completion rate
* Average application completion time
* Prefill rate
* Document reuse rate
* Consent comprehension score
* Drop-off by step
* Deficiency response rate
* Status tracking visits
* Citizen satisfaction score
* Assisted-service completion rate

## 21.2 Producer metrics

* Applications processed
* Average processing time
* SLA compliance
* Deficiency rate
* Deficiency resolution time
* Approval/rejection distribution
* Officer productivity
* Queue backlog
* Escalation rate
* Audit completeness

## 21.3 Platform metrics

* Number of active service manifests
* Number of certified producers
* Number of active tenants
* Number of channels integrated
* Number of plugin integrations
* Manifest reuse rate
* API success rate
* Notification delivery rate
* System uptime
* Security incidents

## 21.4 Impact metrics

* Increase in eligible citizens applying
* Reduction in repeated document uploads
* Reduction in time-to-benefit
* Reduction in grievance resolution time
* Increase in service transparency
* Increase in benefit uptake among underserved groups
* Reduction in department manual workload

---

# 22. Risks and Mitigations

## Risk 1: Becoming a generic form builder

**Mitigation:** Lead with Service Manifest, eligibility, consent, document reuse, workflow, status, and governance. Forms are only one layer.

## Risk 2: Overbuilding the MVP

**Mitigation:** Keep MVP limited to one scholarship workflow. Exclude marketplace, many services, advanced AI, and complex dashboards.

## Risk 3: AI trust failure

**Mitigation:** AI assists only. Rules decide. Workflows approve. Citizens control consent. Every AI use is explainable and logged.

## Risk 4: Consent dark patterns

**Mitigation:** Standardized consent UX, plain-language explanations, no bundled consent, revocation support, audit trail.

## Risk 5: Department adoption friction

**Mitigation:** Provide workflow mode for backend-less departments, templates, managed onboarding, and low-code manifest studio.

## Risk 6: Integration complexity

**Mitigation:** Start with simulation-ready interfaces and one real integration path. Build plugin architecture after repeatable patterns emerge.

## Risk 7: Federal complexity

**Mitigation:** Separate central standards, state configuration, and local execution. Make jurisdiction a core schema object.

## Risk 8: Data privacy concerns

**Mitigation:** Data minimization, consent expiry, document references, field-level permissions, privacy reviews, partner certification.

## Risk 9: Poor service design by producers

**Mitigation:** Opinionated Manifest Studio, certification checklist, accessibility checks, citizen journey testing, service-quality scoring.

## Risk 10: Status tracking not trusted

**Mitigation:** Tie status to workflow events and API callbacks. Make timeline citizen-readable and audit-backed.

---

# 23. Final Deliverables

## 23.1 Crisp product definition

**ServiceFormAI OS is a DigiLocker-first Citizen Service Intelligence Network that helps governments, municipalities, universities, banks, utilities, and approved partners publish services once, match them to eligible citizens with consented and explainable signals, reuse verified DigiLocker documents, route applications and grievances to the right workflow, and track every case until final delivery.**

## 23.2 One-page government pitch

Governments do not need another portal. They need a service delivery operating layer that works across departments, states, municipalities, and citizen channels.

ServiceFormAI OS provides that layer.

It allows departments to publish schemes, certificates, licenses, services, renewals, and grievances using a standard Service Manifest. Citizens can access these services through DigiLocker, UMANG, state portals, municipal apps, WhatsApp, CSCs, or partner channels. With explicit consent, verified DigiLocker documents can be reused to check eligibility, prefill applications, reduce repeated uploads, and improve service completion.

For departments with existing APIs, ServiceFormAI OS acts as an exchange layer. For departments without backends, it provides a full Tenant Workflow OS with officer queues, deficiencies, approvals, SLAs, notifications, dashboards, and audit logs.

For governments, this creates:

* Higher scheme uptake
* Faster application completion
* Reduced document duplication
* Better SLA visibility
* Stronger grievance resolution
* Better audit and compliance
* Multi-channel access
* Federal/state/local interoperability

The first pilot is a DigiLocker Scholarship Pilot: one scholarship, one department workflow, one citizen journey, document reuse, consent, application, deficiency, approval, and status tracking.

This is a practical path from one high-impact service to infrastructure-level public-service delivery.

## 23.3 One-page founder pitch

ServiceFormAI OS is not a form builder. It is the operating system for citizen service delivery.

The wedge is simple: students and welfare beneficiaries repeatedly struggle to discover schemes, prove eligibility, upload documents, and track applications. Departments struggle because many do not have mature backends, workflows, or service intelligence.

We solve this with a DigiLocker-first platform that turns verified documents into completed service journeys.

Our core IP is the Service Manifest Protocol: a machine-readable contract that defines eligibility, documents, consent, form, journey, workflow, API routing, notifications, SLA, status, outputs, grievances, and audit.

The MVP is a scholarship pilot. A student logs in, sees a recommended scheme, checks eligibility, consents to use DigiLocker documents, submits a prefilled application, tracks status, fixes deficiencies, and receives approval. The department gets a workflow backend.

From there, the platform expands into welfare schemes, certificates, municipal services, grievances, renewals, and public-private services.

The ambition is to become the service intelligence layer between citizens, digital document wallets, government departments, municipalities, and approved private service providers.

## 23.4 One-page investor pitch

Public-service delivery is one of the largest software markets that still behaves like disconnected paperwork. Governments and public-service providers operate thousands of services, but citizens still search manually, upload documents repeatedly, and chase status. Departments often lack workflow systems, interoperability, and citizen-friendly distribution.

ServiceFormAI OS creates a new category: Citizen Service Intelligence Network.

It sits between document wallets such as DigiLocker, public-service producers, and citizen channels. It standardizes services through a Service Manifest Protocol and provides eligibility intelligence, consented document reuse, dynamic journeys, workflow processing, status tracking, notifications, grievance handling, and audit.

The go-to-market wedge is a DigiLocker-first scholarship/welfare pilot. This is narrow, high-pain, easy to demonstrate, and expandable across departments.

Expansion paths include:

* Welfare schemes
* Education benefits
* Municipal services
* Local grievances
* Certificates and licenses
* Renewals
* Public-private services
* Workflow SaaS for backend-less agencies
* Certified plugin marketplace

The long-term moat comes from:

* Service Manifest standard
* Workflow templates
* Document mappings
* Consent/audit infrastructure
* Government integrations
* Multi-tenant operational data model
* Trusted ecosystem positioning

This can become infrastructure-level software because it solves a structural coordination problem, not just a UI problem.

## 23.5 One-page architecture summary

ServiceFormAI OS has eight layers:

1. **Citizen Access Layer** — DigiLocker, UMANG, state portals, municipal apps, WhatsApp, CSCs, partner apps.
2. **Identity and Wallet Layer** — SSO, DigiLocker, document wallet, citizen profile, consent.
3. **Service Intelligence Layer** — registry, manifests, eligibility, recommendations, service feed.
4. **Form and Journey Layer** — dynamic forms, guided journeys, prefill, review, submission.
5. **Submission and Case Layer** — applications, grievances, renewals, acknowledgements, statuses.
6. **Workflow and Fulfilment Layer** — officer queues, approvals, deficiencies, SLAs, certificates.
7. **Integration and Plugin Layer** — APIs, webhooks, payments, notifications, eSign, verification, GIS.
8. **Governance and Trust Layer** — audit, certification, security, privacy, compliance, observability.

The MVP should be a modular monolith with clean boundaries around manifest, consent, eligibility, form, case, workflow, notification, and audit modules. This gives speed now and future service extraction later.

## 23.6 One-page MVP execution plan

### Goal

Build and demo a DigiLocker-first scholarship application pilot.

### Timeline structure

**Sprint 1: Foundation**

* Domain model
* Scholarship manifest
* Citizen login simulation
* Basic tenant/admin setup
* Consent model

**Sprint 2: Citizen journey**

* Service feed card
* Eligibility check
* Document reuse screen
* Dynamic form
* Review and submit
* Acknowledgement

**Sprint 3: Workflow OS**

* Officer queue
* Application detail view
* Document verification
* Deficiency raise
* Citizen resubmission
* Approval/rejection

**Sprint 4: Status, notifications, audit**

* Status timeline
* Notification templates
* Audit events
* MIS dashboard
* Demo data
* End-to-end hardening

### Demo outcome

A student discovers, applies, corrects deficiency, and receives approval. An officer processes the same case in a tenant workflow backend. The system shows consent, document reuse, status tracking, notifications, and audit.

## 23.7 Seven-minute demo script

### Minute 0–1: Problem and vision

“Today, citizens search for schemes, upload the same documents repeatedly, and chase status. Departments struggle because services are published differently and many lack workflow backends. ServiceFormAI OS changes this. Eligible services reach citizens, verified documents are reused with consent, and every application is tracked to resolution.”

### Minute 1–2: Citizen login and service feed

Show student login through DigiLocker-style flow. Open Citizen Service Feed. Show “State Merit Scholarship” recommended card. Explain why it appears.

### Minute 2–3: Eligibility and consent

Click “Check eligibility.” Show plain-language consent: identity, education, income, bank details. Citizen grants service-specific, time-bound consent. Show eligibility result: “You may be eligible.”

### Minute 3–4: Document reuse and prefilled form

Show required documents. Identity and education documents are available in DigiLocker. Income certificate is reused or uploaded if missing. Form fields are prefilled. Citizen reviews and submits. Acknowledgement is generated.

### Minute 4–5: Officer workflow

Switch to department portal. Show application in officer queue. Open case. Show document evidence, eligibility summary, and audit history. Officer raises deficiency for income certificate validity.

### Minute 5–6: Citizen resubmission and approval

Switch back to citizen. Notification says correction needed. Citizen uploads corrected document or selects updated DigiLocker document. Officer receives resubmission and approves. Citizen sees approved status.

### Minute 6–7: Platform value

Show admin manifest and workflow configuration. Show status timeline, notification log, SLA dashboard, and audit trail. Close with: “This is not a form. This is a reusable service delivery protocol and workflow OS that can scale from scholarships to municipal grievances, certificates, licenses, renewals, and public-private services.”

## 23.8 Top 10 product principles

1. Publish once, serve everywhere.
2. Citizen consent is the control plane.
3. Verified documents should replace repeated uploads.
4. Eligibility must be explainable and humble.
5. Forms are only one part of service delivery.
6. Grievances are first-class services.
7. Federal standards, local execution.
8. Backend-less departments still need world-class workflows.
9. AI assists; rules and accountable workflows decide.
10. Every case needs status, SLA, and audit.

## 23.9 Top 10 reasons this can become infrastructure-level software

1. It defines a reusable Service Manifest Protocol.
2. It connects citizen wallets, service producers, and channels.
3. It works for both API-ready and backend-less departments.
4. It supports federal, state, district, and local routing.
5. It treats consent, audit, and privacy as core infrastructure.
6. It can power many channels, not just one portal.
7. It turns eligibility discovery into a governed network function.
8. It standardizes status and grievance lifecycle.
9. It creates reusable workflow and service templates.
10. It can expand from one scholarship to thousands of services.

## 23.10 Top 10 things not to build in MVP

1. Full national service registry.
2. Full plugin marketplace.
3. Real AI decisioning.
4. Dozens of services.
5. Complex federal dashboards.
6. Full payment marketplace.
7. Real-time integration with every department.
8. Complex municipal rollout.
9. Advanced fraud detection.
10. Multi-country deployment.

---

# Final Strategic Verdict

ServiceFormAI OS can be a world-class product if it stays disciplined.

The winning strategy is not to build “AI forms.” The winning strategy is to build the **service intelligence, consent, document reuse, workflow, and governance layer** that every modern public-service ecosystem needs.

The MVP must prove one beautiful, complete journey. The full vision must remain protocol-driven, federal-ready, privacy-preserving, and multi-channel.

If executed this way, ServiceFormAI OS can evolve from a DigiLocker scholarship pilot into infrastructure-level software for national-scale citizen service delivery.
