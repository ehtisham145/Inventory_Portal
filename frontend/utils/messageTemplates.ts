export interface MessageTemplate {
  label: string;
  value: string;
}

export const DEFAULT_PROPOSAL_TITLE = "Client confirmation, approval and responsibility for fta tax filing";

export const FTA_CONFIRMATION_MESSAGE =
  `I/We, the undersigned Client, confirm that I/we have reviewed the complete tax filing prepared for submission to the UAE Federal Tax Authority ("FTA") and give full approval for its submission. By approving, I/we declare that:

• This confirmation applies to both VAT filing and Corporate Tax filing submitted to the FTA.
• All information and documents provided to Al Merak Tax Consultant L.L.C are complete, accurate, and not misleading.
• The filing was prepared solely on the information I/we furnished, confirmed, or approved, with no further changes required.
• As the Taxable Person, I/we retain full responsibility for the accuracy of the filing and compliance with UAE tax laws.
• I/we accept responsibility for any liabilities, penalties, or fines resulting from inaccurate or incomplete information provided by me/us.
• Al Merak Tax Consultant L.L.C prepared this filing in good faith based on our information and is not liable for independently verifying it; I/we agree to indemnify Al Merak Tax Consultant L.L.C against claims arising from information we supplied.`;

export const FTA_CONFIRMATION_MESSAGE_AR =
  `أقر أنا/نحن، العميل الموقّع أدناه، بأنني/أننا راجعت/راجعنا الإقرار الضريبي الكامل المُعد لتقديمه إلى الهيئة الاتحادية للضرائب في دولة الإمارات العربية المتحدة ("الهيئة")، وأمنح/نمنح موافقتي/موافقتنا الكاملة على تقديمه. وبموافقتي/موافقتنا، أقر/نقر بما يلي:

• ينطبق هذا الإقرار على كل من إقرار ضريبة القيمة المضافة وإقرار ضريبة الشركات المقدمين إلى الهيئة.
• جميع المعلومات والمستندات المقدمة إلى Al Merak كاملة ودقيقة وغير مضللة.
• تم إعداد الإقرار بناءً فقط على المعلومات التي قدمتها/قدمناها أو أكدتها/أكدناها أو اعتمدتها/اعتمدناها، ولا توجد تعديلات إضافية مطلوبة.
• بصفتي/بصفتنا الشخص الخاضع للضريبة، أتحمل/نتحمل كامل المسؤولية عن دقة الإقرار والالتزام بالقوانين الضريبية الإماراتية.
• أتحمل/نتحمل مسؤولية أي التزامات أو غرامات أو جزاءات ناتجة عن معلومات غير دقيقة أو غير مكتملة قدمتها/قدمناها.
• أعدّت Al Merak هذا الإقرار بحسن نية بناءً على معلوماتنا، وهي غير مسؤولة عن التحقق المستقل منها؛ وأوافق/نوافق على تعويض Al Merak عن أي مطالبات ناشئة عن المعلومات التي قدمناها.`;

export const FTA_CONFIRMATION_MESSAGE_BILINGUAL = `${FTA_CONFIRMATION_MESSAGE}\n\n${FTA_CONFIRMATION_MESSAGE_AR}`;

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    label: "FTA Tax Filing – Client Confirmation & Approval (English + Arabic)",
    value: FTA_CONFIRMATION_MESSAGE_BILINGUAL,
  },
  {
    label: "FTA Tax Filing – Client Confirmation & Approval (English only)",
    value: FTA_CONFIRMATION_MESSAGE,
  },
  {
    label: "FTA Tax Filing – Client Confirmation & Approval (Arabic only)",
    value: FTA_CONFIRMATION_MESSAGE_AR,
  },
];
