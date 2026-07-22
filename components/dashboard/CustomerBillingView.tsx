'use client';

import React from 'react';
import { CreditCard, Check } from 'lucide-react';
import { Plan, Transaction, toUUID } from '../../lib/directus';

export interface CustomerBillingViewProps {
  user: any;
  plans: Plan[];
  transactions: Transaction[];
  setSimulatedGateway: (gateway: string) => void;
  handleInitiatePayment: (plan: Plan) => void;
}

export function CustomerBillingView({
  user,
  plans,
  transactions,
  setSimulatedGateway,
  handleInitiatePayment
}: CustomerBillingViewProps) {
  const resolvedPlans = Array.isArray(plans) ? plans : [];
  const userTenantId = user?.tenant_id || 't-1';
  const userTenantUUID = toUUID(userTenantId);

  const filteredPlans = resolvedPlans.filter((p) => {
    const planTenantId = p.tenant_id || 't-1';
    const planTenantUUID = toUUID(planTenantId);
    return planTenantUUID === userTenantUUID || planTenantId === userTenantId || planTenantId === 't-1' || planTenantUUID === toUUID('t-1');
  });

  const plansToShow = filteredPlans.length > 0 ? filteredPlans : resolvedPlans;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold text-white">شارژ کیف پول و ارتقای طرح اشتراک</h2>
        <p className="text-xs text-slate-400 mt-1">با خرید اشتراک، سقف ساخت کارت و تم‌های اختصاصی برای شما افزایش می‌یابد.</p>
      </div>

      {/* Offline & Online payment user guide */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1 text-right">
          <p className="font-bold text-slate-200 flex items-center gap-1.5 justify-start">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            پرداخت آفلاین (کارت به کارت) و فعال‌سازی دستی اشتراک
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            شما می‌توانید مبلغ پلن دلخواه خود را مستقیماً به شماره کارت مدیریت واریز کرده و با کلیک روی دکمه <span className="text-slate-200 font-semibold">«ثبت فیش واریزی (کارت به کارت)»</span>، مشخصات فیش و تصویر رسید خود را ثبت نمایید تا پس از تایید مدیریت فعال گردد.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-blue-500/10 text-blue-400 font-bold rounded-lg shrink-0 text-[10px] self-start md:self-auto">
          پرداخت کارت به کارت (آفلاین)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {plansToShow.map((plan) => (
          <div key={plan.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:border-blue-600/40 transition">
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-white text-sm">{plan.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded">
                    مدت دوره: {plan.duration_days === -1 ? 'نامحدود (دائمی)' : `${plan.duration_days} روز`}
                  </span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded">
                    حداکثر کارت: {plan.max_cards === -1 ? 'نامحدود' : `${plan.max_cards} کارت`}
                  </span>
                </div>
              </div>

              <div className="py-2.5 border-t border-b border-slate-900/60 flex items-baseline gap-1">
                {plan.price === 0 ? (
                  <span className="text-xl font-bold text-emerald-400">رایگان</span>
                ) : (
                  <>
                    <span className="text-2xl font-black text-white">{(plan.price).toLocaleString('fa-IR')}</span>
                    <span className="text-[10px] text-slate-400 font-bold">تومان</span>
                  </>
                )}
              </div>

              {/* Extended plan attributes */}
              <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850 space-y-1.5 text-[10px] text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">قالب‌های مجاز:</span>
                  <span className="font-bold text-slate-200">
                    {plan.allowed_templates && plan.allowed_templates.length > 0 ? `${plan.allowed_templates.length} قالب انتخاب‌شده` : 'دسترسی به همه قالب‌ها'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">دامنه اختصاصی:</span>
                  <span className={`font-bold ${plan.custom_domain ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {plan.custom_domain ? 'پشتیبانی می‌شود' : 'ندارد'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">حذف برندینگ سامانه:</span>
                  <span className={`font-bold ${plan.remove_branding ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {plan.remove_branding ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
              </div>

              <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed font-medium">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.price === 0 ? (
              <button
                disabled
                className="w-full py-2.5 bg-slate-900 text-slate-600 rounded-xl font-bold text-xs cursor-not-allowed"
              >
                پیش‌فرض ثبت‌نام
              </button>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <button
                  onClick={() => {
                    setSimulatedGateway('کارت به کارت (پرداخت آفلاین)');
                    handleInitiatePayment(plan);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition shadow shadow-blue-600/10 flex items-center justify-center gap-1 cursor-pointer"
                >
                  ثبت فیش واریزی (کارت به کارت)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transactions list */}
      <div className="pt-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <CreditCard className="h-4.5 w-4.5 text-blue-400" />
          تاریخچه فاکتورها و تراکنش‌های بانکی شما:
        </h3>

        <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-right">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] font-bold">
              <tr>
                <th className="p-3">مبلغ پرداختی</th>
                <th className="p-3">درگاه بانکی</th>
                <th className="p-3">کد پیگیری مرجع</th>
                <th className="p-3">تاریخ پرداخت</th>
                <th className="p-3">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40 text-slate-300">
              {transactions.filter(t => toUUID(t.user_id) === toUUID(user.id)).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold">{tx.amount.toLocaleString('fa-IR')} تومان</td>
                  <td className="p-3">{tx.gateway}</td>
                  <td className="p-3 font-mono">{tx.ref_id}</td>
                  <td className="p-3 opacity-70">{tx.created_at.split('T')[0]}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded-full">
                      موفقیت‌آمیز
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
