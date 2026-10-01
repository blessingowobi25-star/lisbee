-- ===========================================================================
-- LisBee — FAQ and policy content
--
-- GENERATED FILE. Do not hand-edit.
-- Regenerate with:  node scripts/generate-content-sql.mjs
--
-- Source of truth is lib/db/seed.ts. This exists so the /faq page and the four
-- policy routes are not empty on a fresh database. Both tables are editable in
-- Admin -> Content & delivery, and re-running this file restores the defaults.
--
-- Safe to run more than once: every insert is an upsert.
-- ===========================================================================


-- ------------------------------------------------------------------- faqs
insert into public.faqs (id, category, question, answer, display_order)
values
  ('faq-1', 'Workweek Box', 'How does the Workweek Box work?', 'You place one order and we deliver one box. Inside are five individually packaged moments, one for each weekday from Monday to Friday. Each day''s pack holds a drink or tea, a snack or treat, and a small LisBee daily card. The recipient opens one pack a day.', 1),
  ('faq-2', 'Workweek Box', 'Which size should I choose?', 'Premium (₦20,000) is a thoughtful everyday gift. Signature (₦35,000) is our flagship and the best balance of variety and presentation. Executive (₦60,000) is built for executives, board members and valued clients.', 2),
  ('faq-3', 'Delivery', 'Where does LisBee deliver?', 'We currently deliver in Abuja and Lagos only. Delivery timing and the delivery fee are confirmed before your order is dispatched. More cities will follow.', 3),
  ('faq-4', 'Payment', 'How do I pay?', 'At launch we accept bank transfer. After checkout you will see the account details, your payment reference and the exact amount to send. Once we confirm the transfer, we start preparing your order. Online card payment is coming soon.', 4),
  ('faq-5', 'Orders', 'Can I send the gift directly to someone else?', 'Yes. Enter the recipient''s name, phone number and delivery address at checkout. If the gift is for you, tick ''This gift is for me'' and we will use your details.', 5),
  ('faq-6', 'Orders', 'Can I add a gift message?', 'Yes. There is a gift message field at checkout. We print it on the card that goes with the box.', 6),
  ('faq-7', 'Corporate', 'Do you handle corporate and bulk orders?', 'Yes. Employee appreciation, onboarding, client gifting, executive gifts, team celebrations and festive programmes. Share the details on our corporate gifting page and we will come back with a proposal.', 7),
  ('faq-8', 'Corporate', 'Can you add our company branding?', 'Personalisation and company branding are available on request for corporate orders. Mention it in your enquiry and we will confirm what is possible for your timeline.', 8),
  ('faq-9', 'Workweek Box', 'How long do the items keep?', 'The box is built around shelf-stable packaged goods. Exact batch and expiry details are shared with each order — tell us if you need them for a specific date.', 9),
  ('faq-10', 'Orders', 'What if I need help with my order?', 'Message us on WhatsApp at 07061804951 or email hellolisbee@gmail.com. We answer order questions there directly.', 10)
on conflict (id) do update
set category = excluded.category,
    question = excluded.question,
    answer = excluded.answer,
    display_order = excluded.display_order;

-- ----------------------------------------------------------- policy pages
insert into public.pages (slug, title, body)
values
  ('delivery', 'Delivery Policy', 'Where we deliver: Abuja and Lagos. We are not delivering to other locations at this time.

Fees: delivery fees depend on your location and are confirmed before your order is dispatched. Fees appear at checkout once they are configured for your area.

Timing: choose a preferred delivery date at checkout. We confirm the exact window with you, including same-day or next-day options where they are available for your area.

Receiving the gift: someone should be available at the delivery address. If the recipient is unavailable, we will call the phone number provided to arrange the next attempt.

Delays: traffic, weather and public holidays can affect timing. If we expect a delay, we will tell you early.

Questions: WhatsApp 07061804951 or email hellolisbee@gmail.com.'),
  ('refunds', 'Refund & Returns Policy', 'We want every gift to arrive as expected.

Damaged or incorrect orders: if your order arrives damaged, incomplete or different from what you ordered, contact us within 24 hours with a photo. We will make it right — replace the item, send the missing piece or refund you.

Change of mind: because our gifts are food products assembled to order, we cannot accept returns for a change of mind once the order has been prepared.

Cancellations: orders can be cancelled for a full refund before preparation begins. Once an order is prepared or dispatched, it can no longer be cancelled.

Refund timing: approved refunds are sent by bank transfer within 3–5 working days to the account used for payment.

Start a request: WhatsApp 07061804951 or email hellolisbee@gmail.com with your order number.'),
  ('terms', 'Terms & Conditions', 'These terms apply to orders placed on the LisBee website.

Orders: an order is confirmed once we receive payment by bank transfer and send you a payment confirmation. Until then, prices and availability may change.

Pricing: all prices are in Naira and include packaging. Delivery fees are confirmed separately based on your delivery location.

Delivery: we currently deliver in Abuja and Lagos. Delivery dates are estimates and depend on location and schedule; we confirm timing with you before dispatch.

Gift content: the box contents listed for each product describe the intended composition. Individual items may be substituted with one of equal or greater value when a specific item is unavailable; we will tell you if this happens.

Cancellation: contact us as soon as possible. If your order has not been prepared, we can usually cancel and refund. Once dispatched, the order cannot be cancelled.

Contact: hellolisbee@gmail.com or WhatsApp 07061804951.'),
  ('privacy-policy', 'Privacy Policy', 'This policy explains how LisBee handles your information when you shop with us.

What we collect: your name, email address, phone number, delivery details, recipient details and order history. We collect only what we need to take payment, deliver gifts and support you after the sale.

How we use it: to process and deliver orders, send order updates by email, respond to enquiries and improve the shop. We do not sell your personal information.

Recipients: when you send a gift, we use the recipient''s name, phone number and address for that delivery only.

Payments: at launch, payments are made by bank transfer. Card payments will be processed by a secure payment provider once enabled; we never store your bank details.

Cookies: we use essential cookies to keep your cart and session working, and optional analytics cookies to understand how the shop is used.

Questions: email hellolisbee@gmail.com or message 07061804951.')
on conflict (slug) do update
set title = excluded.title,
    body = excluded.body,
    updated_at = now();

-- ================================================================ verify
select slug, title, length(body) as body_chars from public.pages order by slug;
select category, count(*) from public.faqs group by category order by category;
