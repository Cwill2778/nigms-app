import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import charlesPortrait from '../assets/charlesImg.jpg';
import charlesWorking from '../assets/CharlesWorking1.jpg';
import deckImg from '../assets/deckBeforeAndAfter.webp';
import fanImg from '../assets/exteriorFanInstallation.jpg';
import storeFront from '../assets/storeFront.webp';
import logo from '../assets/logo.png';
import { AuditBarcode } from '../components/dashboard/AuditBarcode';
import { CHARLES_SIGNATURE_SRC } from '../components/dashboard/CharlesSignature';

const PUNCH_LIST_CATEGORIES = [
  {
    category: 'Plumbing & Water Fixtures',
    icon: '🚰',
    items: [
      'Leaky faucet or kitchen sprayer repair',
      'Running or rocking toilet rebuild',
      'Garbage disposal replacement / jam fix',
      'Outdoor spigot / hose bib freeze repair',
      'Slow sink or shower drain clearing',
      'Under-sink water filtration install'
    ]
  },
  {
    category: 'Carpentry, Decks & Doors',
    icon: '🪵',
    items: [
      'Deck board replacement & fastener tune-up',
      'Loose deck railing or stair stabilization',
      'Exterior door weatherstripping & draft sealing',
      'Sticking or misaligned interior/exterior door',
      'Exterior wood rot patching (trim / fascia)',
      'Cabinet hardware & hinge alignment'
    ]
  },
  {
    category: 'Electrical, Lighting & Comfort',
    icon: '💡',
    items: [
      'Ceiling fan replacement or installation',
      'Porch, patio, or landscape lighting fixture swap',
      'Faulty GFCI or wall switch replacement',
      'Smart thermostat or video doorbell install',
      'Smoke detector battery / unit refresh',
      'Chandelier or dining fixture hanging'
    ]
  },
  {
    category: 'Drywall, Paint & Caulking',
    icon: '🎨',
    items: [
      'Drywall patch (nail holes, doorknob dent, water spot)',
      'Shower & bathtub silicone re-caulking',
      'Kitchen backsplash or counter seam caulk',
      'Baseboard, casing, or molding touch-up repair',
      'Ceiling texture or drywall seam repair'
    ]
  },
  {
    category: 'Preventative & Exterior Upkeep',
    icon: '🏡',
    items: [
      'Dryer vent line clearing (fire prevention)',
      'Gutter cleaning & downspout flush',
      'Pressure washing front walkway & entryway',
      'Attic / crawlspace inspection & visual check',
      'HVAC filter swap & drain line check'
    ]
  }
];

const horselegSchema = z.object({
  name: z.string().min(2, 'Please provide your full name'),
  address: z.string().min(5, 'Please provide your Horseleg Creek address so Charles knows the property'),
  phone: z.string().min(10, 'Please provide a valid phone number for Charles to call or text'),
  email: z.string().email('Please provide a valid email for your quote and receipt'),
  preferredTime: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export function HorselegCreek() {
  useScrollToTop();
  usePageMeta(
    '$50 Off Final Bill for Horseleg Creek Residents | Nailed It Property Solutions',
    'Exclusive neighborhood welcome credit for Horseleg Creek residents in Rome, GA. Save $50 off your final bill amount. Bundle your repair tasks with Charles Willis.'
  );

  const [selectedPunchItems, setSelectedPunchItems] = useState([]);
  const [customPunchItem, setCustomPunchItem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(horselegSchema),
    defaultValues: {
      preferredTime: 'Anytime / First Available'
    }
  });

  const togglePunchItem = (item) => {
    if (selectedPunchItems.includes(item)) {
      setSelectedPunchItems(selectedPunchItems.filter((i) => i !== item));
    } else {
      setSelectedPunchItems([...selectedPunchItems, item]);
    }
  };

  const addCustomItem = (e) => {
    e.preventDefault();
    if (!customPunchItem.trim()) return;
    const item = customPunchItem.trim();
    if (!selectedPunchItems.includes(item)) {
      setSelectedPunchItems([...selectedPunchItems, item]);
    }
    setCustomPunchItem('');
  };

  const removePunchItem = (item) => {
    setSelectedPunchItems(selectedPunchItems.filter((i) => i !== item));
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const punchListFormatted = selectedPunchItems.length > 0
        ? '\n\nSELECTED PUNCH-LIST ITEMS (' + selectedPunchItems.length + '):\n' + selectedPunchItems.map((it, idx) => '  ' + (idx + 1) + '. ' + it).join('\n')
        : '\n\nSELECTED PUNCH-LIST: (None checked - general repair request)';

      const fullMessage = '[HORSELEG CREEK DIRECT-MAIL PROMO - $50 OFF FINAL BILL]\n' +
        'Address: ' + data.address + '\n' +
        'Preferred Scheduling: ' + (data.preferredTime || 'Not specified') + '\n' +
        'Promo Code: HORSELEG50 ($50.00 Credit Off Final Bill Verified)' +
        punchListFormatted + '\n\n' +
        'Homeowner Notes:\n' + (data.additionalNotes || 'No additional notes provided.');

      const dbPayload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        interest: 'Horseleg Creek $50 Off Mailer',
        message: fullMessage
      };

      const { error } = await supabase.from('contact_submissions').insert(dbPayload);
      if (error) console.warn('Supabase submission fallback:', error);

      // Post to Formspree notification
      await fetch('https://formspree.io/f/xqeooyyl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...data,
          promoCode: 'HORSELEG50 ($50 OFF FINAL BILL)',
          punchList: selectedPunchItems,
          source: 'Horseleg Creek Direct Mail Landing Page'
        }),
      }).catch((e) => console.warn('Formspree fallback:', e));

      setSubmittedSuccess(true);
      toast.success('Punch-List & $50 Voucher Received!', {
        description: 'Charles Willis has received your request and will follow up promptly with pricing.'
      });
      reset();
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Could not submit punch-list.', {
        description: 'Please call or text Charles on his cell at (706) 844-8059 or office at (706) 237-8184.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#0A0A0A] text-white min-h-screen">
      {/* TOP DIRECT-MAIL CALL BANNER */}
      <div className="bg-brand-gold text-[#0A0A0A] px-4 py-2.5 text-center text-xs sm:text-sm font-heading font-bold uppercase tracking-wider flex flex-wrap items-center justify-center gap-2 sm:gap-3 shadow-md">
        <span>📮 Letter Recipient Special</span>
        <span className="hidden sm:inline">•</span>
        <span>
          Charles' Cell:{' '}
          <a href="tel:7068448059" className="underline hover:opacity-80 font-black">
            (706) 844-8059
          </a>
        </span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">
          Office:{' '}
          <a href="tel:7062378184" className="underline hover:opacity-80 font-bold">
            (706) 237-8184
          </a>
        </span>
      </div>

      {/* HERO SECTION */}
      <section 
        className="relative px-4 py-20 sm:py-28 md:py-36 text-center bg-cover bg-center bg-no-repeat border-b border-white/10"
        style={{ backgroundImage: `url(${storeFront})` }}
      >
        <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-[2px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/40 text-brand-gold text-xs sm:text-sm font-bold uppercase tracking-widest">
            <span>📍</span>
            <span>Horseleg Creek &amp; Mountain Neighbors</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-bold uppercase tracking-wider text-white leading-tight drop-shadow-lg">
            Did You Get My Letter <br className="hidden sm:inline" />
            In Your Mailbox?
          </h1>

          <div className="h-1.5 w-24 bg-brand-gold mx-auto"></div>

          <p className="text-base sm:text-xl text-[#ccc] max-w-2xl mx-auto leading-relaxed">
            I’m <strong className="text-white">Charles Willis</strong>, owner of <strong className="text-brand-gold">Nailed It Property Solutions</strong> right here in Rome. I sent a letter to your home along Horseleg Creek offering <span className="text-brand-gold font-bold underline">$50 OFF your final bill amount</span>. We suggest bundling tasks together into one call for the best value, but if you only have one repair, that’s completely fine too!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#punch-list-builder"
              className="w-full sm:w-auto bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-sm sm:text-base px-8 py-4 rounded-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,95,31,0.35)] cursor-pointer text-center"
            >
              Build Your Punch-List ($50 Off Bill)
            </a>
            <a
              href="tel:7068448059"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-heading font-bold uppercase tracking-wider text-sm sm:text-base px-8 py-4 rounded-lg border border-white/20 transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>📱</span>
              <span>Call Charles' Cell (706) 844-8059</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#888] font-mono tracking-wider pt-2">
            <span>PROMO CODE: <strong className="text-brand-gold font-bold">HORSELEG50</strong></span>
            <span>•</span>
            <span>$50 OFF FINAL BILL</span>
            <span>•</span>
            <span>OFFICE: <a href="tel:7062378184" className="text-white hover:underline">(706) 237-8184</a></span>
          </div>
        </div>
      </section>

      {/* THE $50 OFFICIAL VOUCHER TICKET */}
      <section className="max-w-4xl mx-auto px-4 -mt-12 sm:-mt-16 relative z-20">
        <div className="bg-white text-slate-900 border-2 border-slate-900 p-2 rounded-xl shadow-2xl">
          <div className="border border-slate-300 rounded-lg p-6 sm:p-8 bg-gradient-to-br from-amber-50/40 via-white to-slate-50 relative overflow-hidden">
            {/* Watermark badge */}
            <div className="absolute right-4 top-4 hidden md:block opacity-10 pointer-events-none">
              <img src={logo} alt="Watermark" className="w-36 h-36 object-contain" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-slate-900 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-md">
                  $50
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
                    NEIGHBORHOOD WELCOME VOUCHER
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black font-heading uppercase text-slate-950 tracking-wider">
                    HORSELEG CREEK $50 FINAL BILL CREDIT
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    $50 deducted directly from your final bill amount. Bundling multiple tasks in one visit is suggested for maximum savings.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 flex-shrink-0 w-full md:w-auto justify-between">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-900 border border-green-300 rounded text-xs font-bold uppercase tracking-wider">
                  ✓ Verified Direct-Mail Voucher
                </span>
                <span className="text-xs font-mono text-slate-600">
                  CODE: <strong className="text-slate-900 bg-slate-200 px-2 py-0.5 rounded font-black">HORSELEG50</strong>
                </span>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Eligible Coverage</span>
                <p className="text-xs font-bold text-slate-900">
                  Horseleg Creek Rd, Horseleg Mountain, &amp; Adjacent Rome Roads
                </p>
                <p className="text-[11px] text-slate-600">
                  Floyd County, GA • ZIP 30165
                </p>
              </div>

              <div className="flex items-center justify-start md:justify-center">
                <AuditBarcode value="HORSELEG50-FINAL-BILL" className="h-7" />
              </div>

              <div className="flex flex-col items-start md:items-end text-left md:text-right">
                <img
                  src={CHARLES_SIGNATURE_SRC}
                  alt="Charles Willis Signature"
                  className="h-8 object-contain -mb-1 select-none pointer-events-none"
                />
                <div className="border-b border-slate-900 w-36 mb-0.5"></div>
                <span className="text-xs font-bold text-slate-900">Charles Willis</span>
                <span className="text-[10px] text-slate-500">Owner, Nailed It Property Solutions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERSONAL LETTER FROM CHARLES */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-brand-gold flex-shrink-0 shadow-xl relative">
              <img
                src={charlesPortrait}
                alt="Charles Willis"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/80 py-1 text-center text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                Rome, GA Native
              </div>
            </div>

            <div className="space-y-4 flex-1 text-sm sm:text-base text-[#ccc] leading-relaxed">
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-brand-gold">
                A Personal Note to Horseleg Creek Homeowners
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white uppercase tracking-wider">
                Why I Reached Out to Your Neighborhood
              </h2>
              <p>
                Horseleg Creek is one of the most distinctive, beautiful corridors in Rome. The custom builds, wooded lots, and established brick homes give our community real character. But character homes also require constant upkeep—from deck boards in the shade to aging plumbing cartridges and exterior weather wear.
              </p>
              <p>
                Too many neighbors tell me the exact same story: they call a big contractor for a small or medium repair and get ghosted, or someone shows up late, charges ridiculous travel fees, and leaves sawdust all over the floor.
              </p>
              <p>
                <strong className="text-white">I started Nailed It Property Solutions to change that.</strong> When you call us, you get responsive communication, clean jobsites, and skilled work done right the first time. I am offering this <strong className="text-brand-gold">$50 off your final bill amount</strong> to use this opportunity to demonstrate the integrity and transparency in a field that has long been struggling in that area. We suggest bundling your punch-list tasks together in one call to get the most value out of our visit, but if you only have one item that needs attention, that is fine too. Check off what you need below, and I will personally get back to you with a fair, straightforward price.
              </p>

              <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/10 gap-3">
                <div className="space-y-0.5">
                  <p className="text-white font-bold text-sm">Charles Willis</p>
                  <p className="text-xs text-[#888]">
                    Direct Cell:{' '}
                    <a href="tel:7068448059" className="text-brand-gold font-bold hover:underline">
                      (706) 844-8059
                    </a>
                    {' '}• Office:{' '}
                    <a href="tel:7062378184" className="text-white/80 hover:underline">
                      (706) 237-8184
                    </a>
                  </p>
                </div>
                <img
                  src={CHARLES_SIGNATURE_SRC}
                  alt="Charles Willis Signature"
                  className="h-9 object-contain invert brightness-200 select-none pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PUNCH-LIST BUILDER SECTION */}
      <section id="punch-list-builder" className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/30">
            Interactive Punch-List Builder
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold uppercase tracking-wider text-white">
            Choose What Needs Fixing
          </h2>
          <p className="text-sm text-[#a0a0a0]">
            Select any tasks around your home that need attention. <strong className="text-white">We suggest bundling tasks together in 1 call</strong> for the highest value, but single tasks are welcome too! We will review your list, apply your <strong>$50 discount directly to the final bill amount</strong>, and get back to you quickly with an honest quote.
          </p>
        </div>

        {/* CATEGORY TABS & CHECKLIST CARDS */}
        <div className="space-y-6">
          {PUNCH_LIST_CATEGORIES.map((cat) => (
            <div key={cat.category} className="bg-[#111111] border border-white/10 rounded-xl p-5 sm:p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="text-base sm:text-lg font-heading font-bold uppercase text-white tracking-wider">
                  {cat.category}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.items.map((item) => {
                  const isChecked = selectedPunchItems.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => togglePunchItem(item)}
                      className={`text-left p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'bg-brand-gold/15 border-brand-gold text-white shadow-[0_0_12px_rgba(255,95,31,0.2)]'
                          : 'bg-[#181818] border-white/5 text-[#a0a0a0] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-[10px] flex-shrink-0 font-bold ${
                        isChecked ? 'bg-brand-gold text-[#0A0A0A]' : 'border border-white/30 text-transparent'
                      }`}>
                        ✓
                      </span>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CUSTOM TASK ENTRY */}
          <div className="bg-[#111111] border border-dashed border-white/20 rounded-xl p-5 sm:p-6">
            <h4 className="text-sm font-heading font-bold uppercase text-brand-gold mb-2 flex items-center gap-2">
              <span>➕</span>
              <span>Need Something Else Not Listed Above?</span>
            </h4>
            <p className="text-xs text-[#a0a0a0] mb-3">
              Type any specific project, odd repair, or custom task here to add it to your punch-list:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customPunchItem}
                onChange={(e) => setCustomPunchItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomItem(e); }}
                placeholder="e.g. Repair screened-in back porch door &amp; latch..."
                className="flex-1 bg-[#181818] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
              <button
                type="button"
                onClick={addCustomItem}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg border border-white/20 cursor-pointer"
              >
                Add to List
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE PUNCH-LIST SUMMARY & BOOKING FORM CONTAINER */}
        <div id="booking-form" className="mt-12 bg-gradient-to-b from-[#141414] to-[#0d0d0d] border-2 border-brand-gold/60 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-brand-gold font-bold">
                STEP 2 OF 2: YOUR ACTIVE PUNCH-LIST
              </span>
              <h3 className="text-2xl font-heading font-bold uppercase text-white tracking-wider mt-1">
                Your Selected Punch-List ({selectedPunchItems.length} {selectedPunchItems.length === 1 ? 'Item' : 'Items'})
              </h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs font-bold font-mono">
              <span>✓</span>
              <span>$50.00 OFF FINAL BILL APPLIED</span>
            </div>
          </div>

          {/* CHOSEN ITEMS PILLS */}
          <div>
            {selectedPunchItems.length === 0 ? (
              <div className="bg-[#181818] p-4 rounded-lg border border-white/10 text-center text-xs text-[#888]">
                No specific items selected above yet. We suggest bundling tasks into 1 call, but you can also submit with a single project in the description below!
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#a0a0a0]">Items ready for Charles to review:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPunchItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 bg-[#222] border border-white/15 px-3 py-1.5 rounded-md text-xs text-white"
                    >
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => removePunchItem(item)}
                        className="text-red-400 hover:text-red-300 font-bold ml-1 cursor-pointer"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SUCCESS MESSAGE */}
          {submittedSuccess ? (
            <div className="bg-green-950/40 border border-green-500/50 p-8 rounded-xl text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto border border-green-500/40">
                ✓
              </div>
              <h4 className="text-2xl font-heading font-bold text-white uppercase tracking-wider">
                Punch-List &amp; $50 Voucher Received!
              </h4>
              <p className="text-sm text-[#ccc] max-w-lg mx-auto">
                Thank you! Charles Willis has received your Horseleg Creek punch-list. He will review your selected items and reach out directly with your discounted quote.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="tel:7068448059"
                  className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg hover:opacity-90 transition-all"
                >
                  Need Immediate Help? Call Charles' Cell (706) 844-8059
                </a>
                <button
                  type="button"
                  onClick={() => setSubmittedSuccess(false)}
                  className="text-xs text-[#888] hover:text-white underline cursor-pointer"
                >
                  Submit Another Project
                </button>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#a0a0a0] mb-2">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Robert &amp; Susan Davis"
                    className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#a0a0a0] mb-2">
                    Horseleg Creek Street Address *
                  </label>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="e.g. 142 Horseleg Creek Rd SW, Rome, GA"
                    className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#a0a0a0] mb-2">
                    Phone Number (Cell / Text preferred) *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="e.g. (706) 555-0192"
                    className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#a0a0a0] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. homeowner@gmail.com"
                    className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#a0a0a0] mb-2">
                  Best Time for Charles to Contact or Inspect
                </label>
                <select
                  {...register('preferredTime')}
                  className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold cursor-pointer"
                >
                  <option value="Anytime / First Available">Anytime / First Available</option>
                  <option value="Mornings (8am - 12pm)">Mornings (8am - 12pm)</option>
                  <option value="Afternoons (12pm - 5pm)">Afternoons (12pm - 5pm)</option>
                  <option value="Call or Text First">Please text me first</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#a0a0a0] mb-2">
                  Additional Details or Property Notes (Optional)
                </label>
                <textarea
                  {...register('additionalNotes')}
                  rows={3}
                  placeholder="Tell us any specifics: gate code, where the water shut-off is, brand of appliance, or when the problem started..."
                  className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                ></textarea>
              </div>

              {/* VOUCHER LOCK-IN BANNER */}
              <div className="bg-[#181818] border border-white/10 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-xl">🎟️</div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Promotion Locked In: $50 OFF Final Bill Amount
                    </span>
                    <span className="text-[11px] text-[#888]">
                      Applied via direct mailer code: <strong className="text-brand-gold">HORSELEG50</strong> • Bundling suggested for maximum savings
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-green-400">-$50.00 Off Final Bill</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-gold hover:opacity-90 text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-base py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,95,31,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Sending Punch-List to Charles...' : 'Send Punch-List & Claim $50 Off Final Bill'}
              </button>

              <p className="text-center text-xs text-[#888]">
                🔒 Your privacy is strictly protected. No spam, no high-pressure sales calls. Charles Willis personally reviews your submission.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* SAMPLE WORK SHOWCASE */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-white/10">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-brand-gold">
            Real Craftsmanship
          </span>
          <h2 className="text-3xl font-heading font-bold uppercase text-white tracking-wider">
            Completed Work Across Rome
          </h2>
          <p className="text-xs sm:text-sm text-[#888]">
            From woodwork and custom decks to electrical and fixture installs, we treat your home like our own.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111111] rounded-xl overflow-hidden border border-white/10 group">
            <div className="aspect-video overflow-hidden">
              <img
                src={deckImg}
                alt="Deck repair and staining"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <span className="text-[10px] font-mono text-brand-gold uppercase font-bold">Carpentry &amp; Decks</span>
              <h4 className="text-sm font-bold text-white mt-1">Deck Rebuild &amp; Stabilization</h4>
              <p className="text-xs text-[#888] mt-1">
                Rotting board replacement, reinforcement, and all-weather stain protection.
              </p>
            </div>
          </div>

          <div className="bg-[#111111] rounded-xl overflow-hidden border border-white/10 group">
            <div className="aspect-video overflow-hidden">
              <img
                src={fanImg}
                alt="Exterior fan and fixture install"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <span className="text-[10px] font-mono text-brand-gold uppercase font-bold">Electrical &amp; Fixtures</span>
              <h4 className="text-sm font-bold text-white mt-1">Outdoor Patio &amp; Fan Installation</h4>
              <p className="text-xs text-[#888] mt-1">
                Weatherproof rated box, clean conduit run, and balanced smooth motor operation.
              </p>
            </div>
          </div>

          <div className="bg-[#111111] rounded-xl overflow-hidden border border-white/10 group">
            <div className="aspect-video overflow-hidden">
              <img
                src={charlesWorking}
                alt="Charles at work"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <span className="text-[10px] font-mono text-brand-gold uppercase font-bold">Hands-On Care</span>
              <h4 className="text-sm font-bold text-white mt-1">Direct Craftsman Oversight</h4>
              <p className="text-xs text-[#888] mt-1">
                Every repair is personally inspected and guaranteed by Charles Willis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-3xl mx-auto px-4 py-16 border-t border-white/10">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold uppercase text-white tracking-wider text-center mb-8">
          Horseleg Creek Resident FAQs
        </h2>

        <div className="space-y-4 text-sm">
          <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
            <h4 className="font-bold text-white text-base mb-1">
              Why are you offering $50 off and how does it work?
            </h4>
            <p className="text-[#a0a0a0]">
              I am offering $50 off your final bill amount to use this opportunity to demonstrate the integrity and transparency in a field that has long been struggling in that area. Simply build your punch-list above or give Charles a call on his cell at (706) 844-8059, and $50 is credited directly toward your final invoice. No gimmicks, no fine-print traps.
            </p>
          </div>

          <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
            <h4 className="font-bold text-white text-base mb-1">
              What if I only have one small repair? Do I need multiple items?
            </h4>
            <p className="text-[#a0a0a0]">
              Instead of one small task, we suggest bundling your home tasks together in one call so you get the most value out of our visit and your $50 discount off the final bill amount. But if you only have one repair right now, that is completely fine too! The $50 credit applies directly to your final bill either way.
            </p>
          </div>

          <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
            <h4 className="font-bold text-white text-base mb-1">
              Do you charge for estimates?
            </h4>
            <p className="text-[#a0a0a0]">
              Yes, we charge $100 for onsite evaluations, but if you let us do the work we credit that towards your bill. However, for over the phone estimates that do not require onsite, it is free.
            </p>
          </div>

          <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
            <h4 className="font-bold text-white text-base mb-1">
              Can I just call you right now instead of filling out the form?
            </h4>
            <p className="text-[#a0a0a0]">
              Absolutely. You can call or text Charles directly on his cell phone at <a href="tel:7068448059" className="text-brand-gold font-bold underline">(706) 844-8059</a>, or reach our office line at <a href="tel:7062378184" className="text-white hover:underline">(706) 237-8184</a>. Mention you received the Horseleg Creek letter, and we will take care of you immediately.
            </p>
          </div>
        </div>

        {/* BOTTOM CALLOUT */}
        <div className="mt-12 text-center bg-brand-gold/10 border border-brand-gold/30 p-8 rounded-2xl space-y-4">
          <h3 className="text-xl sm:text-2xl font-heading font-bold uppercase text-white">
            Ready to Take Care of That To-Do List?
          </h3>
          <p className="text-sm text-[#ccc] max-w-md mx-auto">
            Call Charles Willis directly on his cell or submit your punch-list to claim your $50 final bill credit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="tel:7068448059"
              className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg hover:opacity-90 transition-all shadow-md"
            >
              📱 Call Charles' Cell (706) 844-8059
            </a>
            <a
              href="tel:7062378184"
              className="bg-white/10 hover:bg-white/20 text-white font-heading font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg transition-all border border-white/20"
            >
              🏢 Office (706) 237-8184
            </a>
            <a
              href="#punch-list-builder"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition-all"
            >
              Build Punch-List Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HorselegCreek;
