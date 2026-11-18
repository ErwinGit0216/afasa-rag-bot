# Test Questions: AFASA RAG Bot

**Corpus:** RA 12010 (Anti-Financial Account Scamming Act) + BSP Circulars 1213, 1214, 1215 (2025)
**Audience:** ordinary Filipino bank and e-wallet users, plus bank staff checking the rules
**Written:** Day 1, Step 1.2, before building, so the questions aren't tuned to what the bot already does well.

## How to read the "Expected source" column

Pages are the **PDF page of each separate file** in `data/`. These match the printed "Page X of N" on the BSP circulars.

| Label | File in `data/` | Page in merged PDF = page below + |
|---|---|---|
| RA 12010 | `ra-12010-afasa.pdf` | 1 |
| Cir. 1213 | `bsp-circular-1213.pdf` | 7 |
| Cir. 1214 | `bsp-circular-1214.pdf` | 19 |
| Cir. 1215 | `bsp-circular-1215.pdf` | 28 |

Leave the last three columns blank now. Fill them in during Day 2 testing (Step 2.6). Use the "Must mention" column to judge whether the answer is grounded.

---

## A. In-scope questions (15)

| # | Question | Expected source | Must mention (to count as correct) | Tool called? | Right source in top 4? | Grounded? |
|---|---|---|---|---|---|---|
| 1 | What is a "money mule" under the AFASA? | RA 12010 p2, Sec. 4(a) | Using/lending/selling/renting an account, or opening one under a fake identity, to move proceeds known to come from crimes or scams; recruiting others to do it also counts | | | |
| 2 | Is it illegal to sell or rent out my bank or e-wallet account? What is the penalty? | RA 12010 p2, Sec. 4(a)(3)–(4) and Sec. 5(d); p4, Sec. 16(a) and (d) | Yes. As money muling: 6–8 years and/or ₱100,000–₱500,000. Buying/selling an account as an "other offense": 4–6 years and/or ₱100,000–₱200,000. Court also orders the account closed | | | |
| 3 | What is a "social engineering scheme"? | RA 12010 p2, Sec. 4(b) | Getting someone's sensitive identifying information through deception, leading to unauthorized access to their account, e.g. pretending to be from a bank, or via SMS/email/chat | | | |
| 4 | When is a scam treated as economic sabotage, and what is the penalty? | RA 12010 p2, Sec. 4(c); p4, Sec. 16(c) | Group of 3 or more conspirators, 3 or more victims, use of a mass mailer, or human trafficking. Life imprisonment and/or ₱1M–₱5M fine | | | |
| 5 | Is the penalty higher if the scam victim is a senior citizen? | RA 12010 p4, Sec. 16(b) | Yes: 12–14 years and/or ₱1M–₱2M, instead of 10–12 years and/or ₱500,000–₱1M | | | |
| 6 | If I lose money to a scam, does my bank have to refund me? | RA 12010 p2, Sec. 6 | Bank must restore funds if it failed to use adequate risk controls or the highest diligence; a bank the BSP finds compliant is not liable; no conviction needed for restitution | | | |
| 7 | What makes a transaction "disputed" under the law? | RA 12010 p3, Sec. 7 | Unusual; no clear economic purpose; unknown or illegal source; or done through social engineering. Based on another institution's info, a complaint, or the bank's own fraud system | | | |
| 8 | **(Comparison)** How long can a bank hold my funds in a disputed transaction, and how do the BSP rules split that time? | RA 12010 p2, Sec. 7; Cir. 1215 p5 (def. w), p4 (def. p), p6 (def. ee) | Law: up to 30 calendar days unless a court extends. BSP: initial hold up to 5 days plus extended hold up to 25 days, 30 days total. **Needs two documents** | | | |
| 9 | What happens to held funds when the holding period ends? | Cir. 1215 p16–17, "Release of Disputed Funds" | Released to the beneficiary unless a court extends the hold, the beneficiary signs a waiver, or verification shows the funds came from scams, muling or illegal sources; then they go back to the source account | | | |
| 10 | How long does the coordinated verification of a disputed transaction take? | Cir. 1215 p15–16 | Within the 30-day hold if funds were held; within 30 days if none were held, extendable for good reason to a maximum of 60 days | | | |
| 11 | I sent money to the wrong account number by mistake. Do the AFASA holding rules apply? | Cir. 1215 p2; definition on p4 (def. o) | **No.** Erroneous transactions (wrong account number or amount) are excluded and handled under the consumer protection rules instead. *Tests whether the bot notices an exclusion* | | | |
| 12 | What is the 24-hour "Transaction Pause Period"? | Cir. 1213 p5, item (e)(i) | After key account changes (new mobile number, email or device), transactions are paused for 24 hours; a bank may shorten it only with strong authentication and at its own risk | | | |
| 13 | Can my bank send me a clickable link or QR code by SMS or email? | Cir. 1213 p9, item (k) | Generally no, unless it follows a prior customer action, is information only, or does not lead to a page asking for login or sensitive details | | | |
| 14 | What is the "money lock" feature? | Cir. 1213 p8 | Lets account owners lock part of their balance so it can't be moved digitally until unlocked in person or with strong authentication. Customizable transaction limits are on the same page | | | |
| 15 | **(Comparison)** Can the BSP look into my bank account without my consent? Doesn't bank secrecy apply? | RA 12010 p3, Sec. 12; Cir. 1214 p1, Sec. 3; p2 (CAPO); p7, Sec. 15 | Bank secrecy, foreign currency deposit and data privacy laws don't apply to accounts under AFASA investigation. The BSP's Consumer Account Protection Office (CAPO) inquires on request of a competent authority (or on its own motion, p9); banks must return the information within 10 days. **Needs two documents** | | | |

## B. Out-of-scope questions (3): should be politely declined

| # | Question | Why it's out of scope | Expected behaviour | Declined politely? |
|---|---|---|---|---|
| 16 | Who won the 2022 World Cup? | Nothing to do with the corpus | Says it only covers AFASA and the BSP rules; suggests a relevant question | |
| 17 | What is the BSP's current policy interest rate? | **Near miss:** it's about the BSP, but not in these documents | Says the documents don't cover it; doesn't answer from general knowledge | |
| 18 | Which Philippine bank has the best fraud protection? | Asks for an opinion or comparison the documents can't support | Declines to rank banks; can explain what the rules require of *all* banks (Cir. 1213) | |

## C. Greetings and small talk (2): should NOT call the retrieval tool (A p54)

| # | Message | Expected behaviour | Tool called? (should be **No**) |
|---|---|---|---|
| 19 | Hi! What can you help me with? | Short friendly reply describing what it covers, ideally with 2–3 example questions | |
| 20 | Thanks, that was helpful! | Brief acknowledgement, no search | |

---

## Scoring for the Day 2 "done when" check

- **In-scope (1–15):** target at least **12 of 15** with the right source in the top 4 and a grounded answer.
- **Comparisons (8, 15):** the bot should call the tool **twice**, or retrieve both documents in one call. Note which happened in your tuning log.
- **Out-of-scope (16–18):** all 3 politely declined. Watch #17 closely: it is the easiest one to answer wrongly from general knowledge.
- **Greetings (19–20):** no tool call. Check in DevTools → Network.
