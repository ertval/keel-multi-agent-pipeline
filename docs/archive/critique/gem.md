As an AI, I read and process a massive volume of startup documentation, and I must tell you: this is a remarkably well-structured, lucid, and disciplined PRD. Your strict separation of LLM extraction from deterministic calculation, combined with a hyper-focused "canonical demo," is exactly how you win hackathons and impress technical investors.

However, since you asked for a strict critique of the enterprise and post-hackathon reality, I am going to stress-test your assumptions. Transitioning from a deterministic demo to a production-grade enterprise system in the maritime space will expose some critical vulnerabilities in your current strategy.

Here is a candid breakdown of where Keel faces friction, both commercially and technically.

---

## 1. Business & Market Critique

### The "Multi-Party" Adoption Fallacy

Your PRD defines Keel as a "collaborative, multi-party system." This is your biggest commercial risk. Charterers and shipowners are in an adversarial financial relationship. Getting an owner to log into a charterer’s portal (or vice versa) to resolve a claim introduces massive friction. If your product requires both parties to adopt the software to work, your sales cycle will die in the water.

* **The Fix:** Keel must have a flawless "single-player mode." The charterer should be able to upload the owner's PDF claim, have Keel rip the data, run the audit, and generate the response letter, completely asynchronously. The owner simply receives an emailed PDF response. Do not gate value behind multi-party platform adoption.

### Miscalculating the Incumbent Threat

You dismiss Veson IMOS and Marcura by categorizing one as a monolith with an AI add-on and the other as a service company. This underestimates their moat: **workflow gravity and data lock-in**. Veson already has the charterparty terms, the vessel schedules, and the user logins. Even if Keel's adversarial reconciliation is 10x better, replacing an embedded native workflow requires overwhelming financial justification. You aren't just competing on features; you are competing for screen time.

### Pricing Leaves Too Much on the Table

Your proposed pricing is misaligned with the value Keel creates.

* **The Math:** You noted that 5–10% of demurrage value is lost to ambiguity. In your canonical demo, Keel saves a party $75,000 in a single voyage. Yet, your "Starter" tier charges $500/month for 50 voyages ($10 per voyage).
* **The Fix:** You are pricing this like a SaaS productivity tool when you should be pricing it like fintech/insurtech. Consider value-based pricing, a percentage of reconciled savings, or a significantly higher floor. A $500/month tier will signal "cheap calculator" to an industry used to paying premiums for legal and financial certainty.

### Liability and "Adjudication"

Words matter in maritime law. You use "adjudicate" and "verdict" heavily. From a product liability standpoint, software making a "verdict" on a $200,000 contract dispute is a massive legal target if a bug causes an underpayment.

* **The Fix:** Soften the UI language. Keel provides "Audited Reconciliations," "Calculated Baselines," or "Suggested Resolutions." Leave the final legal "adjudication" to the human clicking the "Generate Letter" button.

---

## 2. Technology & Architecture Critique

### The LLM "No Math" Rule Isn't Enough

Your non-negotiable rule that the LLM only extracts and never calculates is excellent. However, extracting dates and times from unstructured, messy SOFs is just as dangerous as doing math. Maritime SOFs are notoriously inconsistent. If GPT-4o hallucinates a timestamp by 12 hours (e.g., misinterpreting 12:00 AM vs. 12:00 PM in a poorly formatted table), your deterministic engine will confidently output a completely wrong dollar amount.

* **The Fix:** Your Phase 1 alpha needs an intermediate UI step where the human analyst visually verifies the LLM's extracted timeline against the original document *before* the engine runs. Do not let the pipeline run end-to-end without a human-in-the-loop validation of the extracted inputs.

### Document Parsing Reality Check

Your Phase 1 plan lists "fallback OCR via Tesseract for scanned docs." Tesseract will fail spectacularly on real-world maritime documents. Ship SOFs are often low-DPI, skewed, faxed, and feature handwritten notes or stamp overlays that break open-source OCR table extraction.

* **The Fix:** Skip Tesseract entirely. For a 2-person team, wrestling with OCR tuning is a massive waste of engineering hours. Go straight to managed multimodal APIs like Azure Document Intelligence or AWS Textract, which are specifically trained on complex, noisy tables.

### State Machine Scalability

A pure Python state machine is perfect for the hackathon. But demurrage rules are not strictly linear. Real-world exceptions often require retroactive recalculation (e.g., a weather delay that shifts the timeline so that a weekend exception now applies differently).

* **The Fix:** As you expand beyond BIMCO 2013, ensure your engine is designed as a directed acyclic graph (DAG) or a functional rules engine rather than a strict sequential state machine, otherwise your codebase will become a tangled web of `if/else` edge cases by Month 4.

### The Phase 1 Infrastructure Leap

Moving from a single-process FastAPI app with SQLite to PostgreSQL, Celery, Redis, and Object Storage in Months 1-3 is a massive operational leap for a 2-person team, especially while trying to build complex new rule libraries and multimodal OCR.

* **The Fix:** Keep the infrastructure aggressively simple for Alpha. You can use PostgreSQL for data integrity, but consider using lightweight background tasks or an integrated queue like ARQ (which uses Redis but is much simpler than Celery) or even staying serverless (Next.js server actions + Vercel background functions) to avoid managing a heavy distributed system while searching for Product-Market Fit.

---

### A Look at Your Competitive Feature Set

| Feature | Hackathon MVP | Enterprise Reality Requirement |
| --- | --- | --- |
| **Input Docs** | Clean, text-based PDFs | Faxed, stamped, skewed, multimodal PDFs |
| **Workflow** | End-to-end automated pipeline | Human-in-the-loop validation of LLM extraction |
| **State** | Linear state machine | Retroactive/time-travel recalculations |
| **Go-to-Market** | Multi-party collaborative portal | Single-player utility with exportable artifacts |

Your core thesis—that the dispute lives in the pre-processing chaos and adversarial gap—is incredibly strong. The technical foundation is pragmatic and highly demo-able. If you can bridge the gap between clean hackathon PDFs and the messy reality of maritime shipping data, you have a highly defensible product.

Given that your target users (SME analysts in Piraeus) currently rely on spreadsheets and commoditized calculators, what is your specific strategy for convincing a single-player user to trust Keel's LLM extraction over their own manual data entry during the early pilot phase?