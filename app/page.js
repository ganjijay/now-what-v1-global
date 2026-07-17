"use client";

import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { Browser } from "@capacitor/browser";
import { APP_LANGUAGES, useAppLanguage } from "../lib/i18n";
import { auth, googleProvider } from "../lib/firebase";
import {
  consumeOneCredit,
  ensureUserProfile,
  watchCredits
} from "../lib/userService";

const LANGS = APP_LANGUAGES;

const COPY = {
  "en": {
    "hero": "Understand any document. Anywhere.",
    "intro": "Upload a government, banking, healthcare, education, legal, insurance, employment, or contract document. NowWhat explains it clearly and tells you what to do next.",
    "start": "Check my document",
    "free": "New users receive 3 free credits",
    "examples": "See exactly what the result looks like",
    "examplesSub": "Real examples show what NowWhat does in seconds.",
    "what": "What is this?",
    "action": "What should I do now?",
    "deadline": "By when?",
    "reply": "Do I need to reply?",
    "loginTitle": "Start for free",
    "loginText": "Sign in with Google to receive 3 free credits and securely save your balance.",
    "google": "Start free with Google",
    "back": "Back to introduction",
    "welcome": "Welcome",
    "credits": "Credits left",
    "logout": "Sign out",
    "appLanguage": "App language",
    "resultLanguage": "Result language",
    "camera": "Take a photo",
    "gallery": "Choose screenshots",
    "pdf": "Attach PDF",
    "direct": "Enter text",
    "placeholder": "Paste a message, email, or letter...",
    "analyze": "What should I do?",
    "checking": "Checking...",
    "make": "Write a reply",
    "making": "Writing reply...",
    "suggested": "Suggested reply",
    "meaning": "What this reply means",
    "copy": "Copy sendable reply",
    "copied": "Copied ✓",
    "again": "Check something else",
    "required": "✅ Reply needed",
    "none": "❌ No reply needed",
    "unclear": "⚠️ Needs checking",
    "noCredits": "You have no credits left.",
    "buyCredits": "Buy credits",
    "closePlans": "Close plans",
    "choosePlan": "Choose the amount you need",
    "starter": "Starter",
    "popular": "Popular",
    "pro": "Pro",
    "analyses": "analyses",
    "buy": "Buy",
    "openingPayment": "Opening checkout...",
    "paymentCancelled": "Payment was cancelled.",
    "paymentReturn": "Payment completed. Your credits should update automatically.",
    "need": "Add a photo, PDF, or text.",
    "max": "You can select up to 6 files.",
    "disclaimer": "This AI explanation is not official legal, medical, financial, or government advice. Recheck important deadlines and submissions.",
    "support": "Support",
    "admin": "Admin",
    "privacy": "Privacy",
    "terms": "Terms",
    "refunds": "Refunds",
    "contact": "Contact",
    "upload": "Upload a document",
    "understand": "Understand it clearly",
    "next": "Know what to do next",
    "replyCreate": "Create a reply when needed",
    "anywhere": "ANY DOCUMENT · ANYWHERE · ANY LANGUAGE"
  },
  "ko": {
    "hero": "어떤 문서든, 어디에서든 쉽게 이해하세요.",
    "intro": "정부, 은행, 학교, 병원, 보험, 직장 또는 계약 문서를 올리세요. NowWhat이 쉬운 말로 설명하고, 다음에 해야 할 일과 필요한 답장까지 알려드립니다.",
    "start": "내 문서 확인하기",
    "free": "처음 가입하면 무료 크레딧 3회",
    "examples": "실제 결과는 이렇게 보여요",
    "examplesSub": "설명보다 예시를 보면 앱의 가치를 바로 알 수 있어요.",
    "what": "이게 뭐야?",
    "action": "지금 해야 할 일",
    "deadline": "언제까지?",
    "reply": "답장해야 돼?",
    "loginTitle": "무료로 시작하세요",
    "loginText": "Google 계정으로 시작하면 무료 크레딧 3회가 지급되고, 남은 크레딧이 안전하게 저장됩니다.",
    "google": "Google로 무료 시작",
    "back": "설명 화면으로 돌아가기",
    "welcome": "안녕하세요",
    "credits": "남은 크레딧",
    "logout": "로그아웃",
    "appLanguage": "앱 언어",
    "resultLanguage": "결과 언어",
    "camera": "사진 찍기",
    "gallery": "스크린샷 선택",
    "pdf": "PDF 첨부",
    "direct": "내용 직접 입력",
    "placeholder": "문자, 이메일, 편지 내용을 붙여넣으세요...",
    "analyze": "그래서 뭐 해야 돼?",
    "checking": "확인하고 있어요...",
    "make": "답장 만들어줘",
    "making": "답장 만드는 중...",
    "suggested": "추천 답장",
    "meaning": "이 답장의 뜻",
    "copy": "보낼 답장 복사",
    "copied": "복사했어요 ✓",
    "again": "다른 내용 확인하기",
    "required": "✅ 답장 필요",
    "none": "❌ 답장 필요 없음",
    "unclear": "⚠️ 확인 필요",
    "noCredits": "남은 크레딧이 없습니다.",
    "buyCredits": "크레딧 구매",
    "closePlans": "구매창 닫기",
    "choosePlan": "필요한 만큼 충전하세요",
    "starter": "Starter",
    "popular": "인기",
    "pro": "Pro",
    "analyses": "회 분석",
    "buy": "구매하기",
    "openingPayment": "결제창 여는 중...",
    "paymentCancelled": "결제가 취소되었습니다.",
    "paymentReturn": "결제가 완료되었습니다. 크레딧이 자동으로 반영됩니다.",
    "need": "사진, PDF 또는 내용을 입력해 주세요.",
    "max": "파일은 최대 6개까지 선택할 수 있어요.",
    "disclaimer": "AI 설명은 공식 법률·의료·금융·정부기관 자문이 아닙니다. 중요한 제출물과 기한은 원본을 다시 확인하세요.",
    "support": "문의하기",
    "admin": "관리자",
    "privacy": "개인정보",
    "terms": "이용약관",
    "refunds": "환불 정책",
    "contact": "연락처",
    "upload": "문서 업로드",
    "understand": "쉬운 설명",
    "next": "다음 행동 확인",
    "replyCreate": "필요한 답장 생성",
    "anywhere": "어떤 문서든 · 어디에서든 · 어떤 언어든"
  },
  "es": {
    "hero": "Comprende cualquier documento. En cualquier lugar.",
    "intro": "Sube documentos gubernamentales, bancarios, médicos, educativos, legales, de seguros, laborales o contractuales. NowWhat los explica claramente y te indica qué hacer después.",
    "start": "Revisar mi documento",
    "free": "Los usuarios nuevos reciben 3 créditos gratis",
    "examples": "Mira cómo se ve el resultado",
    "examplesSub": "Los ejemplos reales muestran lo que NowWhat hace en segundos.",
    "what": "¿Qué es esto?",
    "action": "¿Qué debo hacer ahora?",
    "deadline": "¿Para cuándo?",
    "reply": "¿Necesito responder?",
    "loginTitle": "Empieza gratis",
    "loginText": "Inicia sesión con Google para recibir 3 créditos gratis y guardar tu saldo de forma segura.",
    "google": "Empezar gratis con Google",
    "back": "Volver a la introducción",
    "welcome": "Hola",
    "credits": "Créditos restantes",
    "logout": "Cerrar sesión",
    "appLanguage": "Idioma de la app",
    "resultLanguage": "Idioma del resultado",
    "camera": "Tomar una foto",
    "gallery": "Elegir capturas",
    "pdf": "Adjuntar PDF",
    "direct": "Escribir texto",
    "placeholder": "Pega un mensaje, correo o carta...",
    "analyze": "¿Qué debo hacer?",
    "checking": "Analizando...",
    "make": "Escribir una respuesta",
    "making": "Creando respuesta...",
    "suggested": "Respuesta sugerida",
    "meaning": "Qué significa esta respuesta",
    "copy": "Copiar respuesta",
    "copied": "Copiado ✓",
    "again": "Revisar otro documento",
    "required": "✅ Se requiere respuesta",
    "none": "❌ No se requiere respuesta",
    "unclear": "⚠️ Requiere revisión",
    "noCredits": "No te quedan créditos.",
    "buyCredits": "Comprar créditos",
    "closePlans": "Cerrar planes",
    "choosePlan": "Elige la cantidad que necesitas",
    "starter": "Inicial",
    "popular": "Popular",
    "pro": "Pro",
    "analyses": "análisis",
    "buy": "Comprar",
    "openingPayment": "Abriendo pago...",
    "paymentCancelled": "El pago fue cancelado.",
    "paymentReturn": "Pago completado. Tus créditos se actualizarán automáticamente.",
    "need": "Añade una foto, PDF o texto.",
    "max": "Puedes seleccionar hasta 6 archivos.",
    "disclaimer": "Esta explicación de IA no es asesoramiento legal, médico, financiero ni gubernamental oficial. Verifica fechas y requisitos importantes.",
    "support": "Ayuda",
    "admin": "Admin",
    "privacy": "Privacidad",
    "terms": "Términos",
    "refunds": "Reembolsos",
    "contact": "Contacto",
    "upload": "Sube un documento",
    "understand": "Compréndelo claramente",
    "next": "Sabe qué hacer después",
    "replyCreate": "Crea una respuesta si es necesario",
    "anywhere": "CUALQUIER DOCUMENTO · EN CUALQUIER LUGAR · CUALQUIER IDIOMA"
  },
  "zh": {
    "hero": "轻松理解任何文件，无论身在何处。",
    "intro": "上传政府、银行、医疗、教育、法律、保险、就业或合同文件。NowWhat 会用清晰易懂的方式解释，并告诉您下一步该做什么。",
    "start": "查看我的文件",
    "free": "新用户可获得 3 个免费额度",
    "examples": "查看实际结果",
    "examplesSub": "真实示例可让您快速了解 NowWhat。",
    "what": "这是什么？",
    "action": "我现在该做什么？",
    "deadline": "截止日期是什么时候？",
    "reply": "我需要回复吗？",
    "loginTitle": "免费开始",
    "loginText": "使用 Google 登录即可获得 3 个免费额度，并安全保存余额。",
    "google": "使用 Google 免费开始",
    "back": "返回介绍",
    "welcome": "您好",
    "credits": "剩余额度",
    "logout": "退出登录",
    "appLanguage": "应用语言",
    "resultLanguage": "结果语言",
    "camera": "拍照",
    "gallery": "选择截图",
    "pdf": "上传 PDF",
    "direct": "输入文字",
    "placeholder": "粘贴短信、电子邮件或信件内容...",
    "analyze": "我该怎么办？",
    "checking": "正在分析...",
    "make": "生成回复",
    "making": "正在生成回复...",
    "suggested": "建议回复",
    "meaning": "这段回复的含义",
    "copy": "复制回复",
    "copied": "已复制 ✓",
    "again": "查看其他内容",
    "required": "✅ 需要回复",
    "none": "❌ 无需回复",
    "unclear": "⚠️ 需要确认",
    "noCredits": "您的额度已用完。",
    "buyCredits": "购买额度",
    "closePlans": "关闭方案",
    "choosePlan": "选择您需要的额度",
    "starter": "入门",
    "popular": "热门",
    "pro": "专业",
    "analyses": "次分析",
    "buy": "购买",
    "openingPayment": "正在打开付款页面...",
    "paymentCancelled": "付款已取消。",
    "paymentReturn": "付款已完成，额度将自动更新。",
    "need": "请添加照片、PDF 或文字。",
    "max": "最多可选择 6 个文件。",
    "disclaimer": "AI 解释不构成官方法律、医疗、金融或政府建议。请核对重要期限和提交要求。",
    "support": "客户支持",
    "admin": "管理员",
    "privacy": "隐私",
    "terms": "条款",
    "refunds": "退款",
    "contact": "联系我们",
    "upload": "上传文件",
    "understand": "清楚理解",
    "next": "了解下一步",
    "replyCreate": "需要时生成回复",
    "anywhere": "任何文件 · 任何地点 · 任何语言"
  },
  "ja": {
    "hero": "どんな書類でも、どこからでも簡単に理解。",
    "intro": "政府、銀行、医療、教育、法律、保険、雇用、契約書類をアップロードしてください。NowWhat が分かりやすく説明し、次に何をすべきか案内します。",
    "start": "書類を確認する",
    "free": "新規ユーザーは3クレジット無料",
    "examples": "実際の結果を見る",
    "examplesSub": "実例で NowWhat の価値がすぐ分かります。",
    "what": "これは何？",
    "action": "今すべきこと",
    "deadline": "期限はいつ？",
    "reply": "返信が必要？",
    "loginTitle": "無料で始める",
    "loginText": "Googleでログインすると3クレジットが付与され、残高が安全に保存されます。",
    "google": "Googleで無料開始",
    "back": "紹介画面に戻る",
    "welcome": "こんにちは",
    "credits": "残りクレジット",
    "logout": "ログアウト",
    "appLanguage": "アプリ言語",
    "resultLanguage": "結果の言語",
    "camera": "写真を撮る",
    "gallery": "スクリーンショットを選ぶ",
    "pdf": "PDFを添付",
    "direct": "テキスト入力",
    "placeholder": "メッセージ、メール、手紙を貼り付けてください...",
    "analyze": "何をすればいい？",
    "checking": "確認中...",
    "make": "返信を作成",
    "making": "返信を作成中...",
    "suggested": "おすすめの返信",
    "meaning": "この返信の意味",
    "copy": "返信をコピー",
    "copied": "コピーしました ✓",
    "again": "別の内容を確認",
    "required": "✅ 返信が必要",
    "none": "❌ 返信不要",
    "unclear": "⚠️ 確認が必要",
    "noCredits": "クレジットがありません。",
    "buyCredits": "クレジット購入",
    "closePlans": "プランを閉じる",
    "choosePlan": "必要な分だけ選択",
    "starter": "スターター",
    "popular": "人気",
    "pro": "プロ",
    "analyses": "回分析",
    "buy": "購入",
    "openingPayment": "決済画面を開いています...",
    "paymentCancelled": "支払いがキャンセルされました。",
    "paymentReturn": "支払いが完了しました。クレジットは自動更新されます。",
    "need": "写真、PDF、またはテキストを追加してください。",
    "max": "最大6ファイルまで選択できます。",
    "disclaimer": "AIの説明は公式な法律・医療・金融・政府の助言ではありません。重要な期限や提出内容は原文を確認してください。",
    "support": "サポート",
    "admin": "管理者",
    "privacy": "プライバシー",
    "terms": "利用規約",
    "refunds": "返金",
    "contact": "お問い合わせ",
    "upload": "書類をアップロード",
    "understand": "分かりやすく理解",
    "next": "次にすべきこと",
    "replyCreate": "必要なら返信を作成",
    "anywhere": "どんな書類でも · どこでも · どの言語でも"
  },
  "pt": {
    "hero": "Entenda qualquer documento. Em qualquer lugar.",
    "intro": "Envie documentos governamentais, bancários, médicos, educacionais, jurídicos, de seguros, emprego ou contratos. O NowWhat explica claramente e diz o que fazer a seguir.",
    "start": "Verificar meu documento",
    "free": "Novos usuários recebem 3 créditos grátis",
    "examples": "Veja como o resultado aparece",
    "examplesSub": "Exemplos reais mostram o que o NowWhat faz em segundos.",
    "what": "O que é isto?",
    "action": "O que devo fazer agora?",
    "deadline": "Até quando?",
    "reply": "Preciso responder?",
    "loginTitle": "Comece grátis",
    "loginText": "Entre com o Google para receber 3 créditos grátis e salvar seu saldo com segurança.",
    "google": "Começar grátis com Google",
    "back": "Voltar à introdução",
    "welcome": "Olá",
    "credits": "Créditos restantes",
    "logout": "Sair",
    "appLanguage": "Idioma do app",
    "resultLanguage": "Idioma do resultado",
    "camera": "Tirar foto",
    "gallery": "Escolher capturas",
    "pdf": "Anexar PDF",
    "direct": "Digitar texto",
    "placeholder": "Cole uma mensagem, e-mail ou carta...",
    "analyze": "O que devo fazer?",
    "checking": "Analisando...",
    "make": "Criar resposta",
    "making": "Criando resposta...",
    "suggested": "Resposta sugerida",
    "meaning": "O que esta resposta significa",
    "copy": "Copiar resposta",
    "copied": "Copiado ✓",
    "again": "Verificar outro conteúdo",
    "required": "✅ Resposta necessária",
    "none": "❌ Resposta não necessária",
    "unclear": "⚠️ Precisa verificar",
    "noCredits": "Você não tem créditos.",
    "buyCredits": "Comprar créditos",
    "closePlans": "Fechar planos",
    "choosePlan": "Escolha a quantidade necessária",
    "starter": "Inicial",
    "popular": "Popular",
    "pro": "Pro",
    "analyses": "análises",
    "buy": "Comprar",
    "openingPayment": "Abrindo pagamento...",
    "paymentCancelled": "O pagamento foi cancelado.",
    "paymentReturn": "Pagamento concluído. Seus créditos serão atualizados automaticamente.",
    "need": "Adicione uma foto, PDF ou texto.",
    "max": "Você pode selecionar até 6 arquivos.",
    "disclaimer": "Esta explicação de IA não é aconselhamento oficial jurídico, médico, financeiro ou governamental. Confirme prazos e requisitos importantes.",
    "support": "Suporte",
    "admin": "Admin",
    "privacy": "Privacidade",
    "terms": "Termos",
    "refunds": "Reembolsos",
    "contact": "Contato",
    "upload": "Envie um documento",
    "understand": "Entenda claramente",
    "next": "Saiba o que fazer depois",
    "replyCreate": "Crie uma resposta quando necessário",
    "anywhere": "QUALQUER DOCUMENTO · EM QUALQUER LUGAR · QUALQUER IDIOMA"
  },
  "fr": {
    "hero": "Comprenez n’importe quel document, où que vous soyez.",
    "intro": "Importez un document administratif, bancaire, médical, scolaire, juridique, d’assurance, professionnel ou contractuel. NowWhat l’explique clairement et vous indique la prochaine étape.",
    "start": "Vérifier mon document",
    "free": "Les nouveaux utilisateurs reçoivent 3 crédits gratuits",
    "examples": "Voyez le résultat réel",
    "examplesSub": "Des exemples concrets montrent ce que NowWhat fait en quelques secondes.",
    "what": "Qu’est-ce que c’est ?",
    "action": "Que dois-je faire maintenant ?",
    "deadline": "Pour quand ?",
    "reply": "Dois-je répondre ?",
    "loginTitle": "Commencez gratuitement",
    "loginText": "Connectez-vous avec Google pour recevoir 3 crédits gratuits et sauvegarder votre solde.",
    "google": "Commencer avec Google",
    "back": "Retour à l’introduction",
    "welcome": "Bonjour",
    "credits": "Crédits restants",
    "logout": "Se déconnecter",
    "appLanguage": "Langue de l’application",
    "resultLanguage": "Langue du résultat",
    "camera": "Prendre une photo",
    "gallery": "Choisir des captures",
    "pdf": "Joindre un PDF",
    "direct": "Saisir du texte",
    "placeholder": "Collez un message, un e-mail ou une lettre...",
    "analyze": "Que dois-je faire ?",
    "checking": "Analyse en cours...",
    "make": "Rédiger une réponse",
    "making": "Rédaction en cours...",
    "suggested": "Réponse suggérée",
    "meaning": "Signification de cette réponse",
    "copy": "Copier la réponse",
    "copied": "Copié ✓",
    "again": "Vérifier autre chose",
    "required": "✅ Réponse nécessaire",
    "none": "❌ Aucune réponse nécessaire",
    "unclear": "⚠️ Vérification nécessaire",
    "noCredits": "Vous n’avez plus de crédits.",
    "buyCredits": "Acheter des crédits",
    "closePlans": "Fermer les offres",
    "choosePlan": "Choisissez la quantité nécessaire",
    "starter": "Débutant",
    "popular": "Populaire",
    "pro": "Pro",
    "analyses": "analyses",
    "buy": "Acheter",
    "openingPayment": "Ouverture du paiement...",
    "paymentCancelled": "Le paiement a été annulé.",
    "paymentReturn": "Paiement terminé. Vos crédits seront mis à jour automatiquement.",
    "need": "Ajoutez une photo, un PDF ou du texte.",
    "max": "Vous pouvez sélectionner jusqu’à 6 fichiers.",
    "disclaimer": "Cette explication IA ne constitue pas un conseil juridique, médical, financier ou administratif officiel. Vérifiez les délais et documents importants.",
    "support": "Assistance",
    "admin": "Admin",
    "privacy": "Confidentialité",
    "terms": "Conditions",
    "refunds": "Remboursements",
    "contact": "Contact",
    "upload": "Importer un document",
    "understand": "Le comprendre clairement",
    "next": "Savoir quoi faire ensuite",
    "replyCreate": "Créer une réponse si nécessaire",
    "anywhere": "TOUT DOCUMENT · PARTOUT · TOUTE LANGUE"
  },
  "de": {
    "hero": "Verstehe jedes Dokument. Überall.",
    "intro": "Lade Behörden-, Bank-, Gesundheits-, Bildungs-, Rechts-, Versicherungs-, Arbeits- oder Vertragsdokumente hoch. NowWhat erklärt sie verständlich und zeigt dir den nächsten Schritt.",
    "start": "Dokument prüfen",
    "free": "Neue Nutzer erhalten 3 kostenlose Credits",
    "examples": "So sieht das Ergebnis aus",
    "examplesSub": "Echte Beispiele zeigen in Sekunden, was NowWhat kann.",
    "what": "Was ist das?",
    "action": "Was soll ich jetzt tun?",
    "deadline": "Bis wann?",
    "reply": "Muss ich antworten?",
    "loginTitle": "Kostenlos starten",
    "loginText": "Melde dich mit Google an, erhalte 3 kostenlose Credits und speichere dein Guthaben sicher.",
    "google": "Kostenlos mit Google starten",
    "back": "Zurück zur Einführung",
    "welcome": "Hallo",
    "credits": "Verbleibende Credits",
    "logout": "Abmelden",
    "appLanguage": "App-Sprache",
    "resultLanguage": "Ergebnissprache",
    "camera": "Foto aufnehmen",
    "gallery": "Screenshots auswählen",
    "pdf": "PDF anhängen",
    "direct": "Text eingeben",
    "placeholder": "Nachricht, E-Mail oder Brief einfügen...",
    "analyze": "Was soll ich tun?",
    "checking": "Wird geprüft...",
    "make": "Antwort erstellen",
    "making": "Antwort wird erstellt...",
    "suggested": "Vorgeschlagene Antwort",
    "meaning": "Bedeutung dieser Antwort",
    "copy": "Antwort kopieren",
    "copied": "Kopiert ✓",
    "again": "Etwas anderes prüfen",
    "required": "✅ Antwort erforderlich",
    "none": "❌ Keine Antwort erforderlich",
    "unclear": "⚠️ Prüfung erforderlich",
    "noCredits": "Keine Credits mehr verfügbar.",
    "buyCredits": "Credits kaufen",
    "closePlans": "Pläne schließen",
    "choosePlan": "Wähle die benötigte Menge",
    "starter": "Starter",
    "popular": "Beliebt",
    "pro": "Pro",
    "analyses": "Analysen",
    "buy": "Kaufen",
    "openingPayment": "Zahlung wird geöffnet...",
    "paymentCancelled": "Zahlung wurde abgebrochen.",
    "paymentReturn": "Zahlung abgeschlossen. Deine Credits werden automatisch aktualisiert.",
    "need": "Foto, PDF oder Text hinzufügen.",
    "max": "Du kannst bis zu 6 Dateien auswählen.",
    "disclaimer": "Diese KI-Erklärung ist keine offizielle rechtliche, medizinische, finanzielle oder behördliche Beratung. Prüfe wichtige Fristen und Einreichungen.",
    "support": "Support",
    "admin": "Admin",
    "privacy": "Datenschutz",
    "terms": "Bedingungen",
    "refunds": "Rückerstattung",
    "contact": "Kontakt",
    "upload": "Dokument hochladen",
    "understand": "Klar verstehen",
    "next": "Nächsten Schritt kennen",
    "replyCreate": "Bei Bedarf Antwort erstellen",
    "anywhere": "JEDES DOKUMENT · ÜBERALL · JEDE SPRACHE"
  },
  "ar": {
    "hero": "افهم أي مستند، أينما كنت.",
    "intro": "ارفع مستندًا حكوميًا أو مصرفيًا أو طبيًا أو تعليميًا أو قانونيًا أو تأمينيًا أو وظيفيًا أو عقدًا. يشرحه NowWhat بوضوح ويخبرك بما يجب فعله بعد ذلك.",
    "start": "فحص مستندي",
    "free": "يحصل المستخدمون الجدد على 3 أرصدة مجانية",
    "examples": "شاهد شكل النتيجة",
    "examplesSub": "توضح الأمثلة الحقيقية ما يفعله NowWhat خلال ثوانٍ.",
    "what": "ما هذا؟",
    "action": "ماذا أفعل الآن؟",
    "deadline": "ما الموعد النهائي؟",
    "reply": "هل أحتاج إلى الرد؟",
    "loginTitle": "ابدأ مجانًا",
    "loginText": "سجّل الدخول باستخدام Google للحصول على 3 أرصدة مجانية وحفظ رصيدك بأمان.",
    "google": "ابدأ مجانًا باستخدام Google",
    "back": "العودة إلى المقدمة",
    "welcome": "مرحبًا",
    "credits": "الأرصدة المتبقية",
    "logout": "تسجيل الخروج",
    "appLanguage": "لغة التطبيق",
    "resultLanguage": "لغة النتيجة",
    "camera": "التقاط صورة",
    "gallery": "اختيار لقطات الشاشة",
    "pdf": "إرفاق PDF",
    "direct": "إدخال نص",
    "placeholder": "ألصق رسالة أو بريدًا إلكترونيًا أو خطابًا...",
    "analyze": "ماذا يجب أن أفعل؟",
    "checking": "جارٍ التحليل...",
    "make": "إنشاء رد",
    "making": "جارٍ إنشاء الرد...",
    "suggested": "الرد المقترح",
    "meaning": "معنى هذا الرد",
    "copy": "نسخ الرد",
    "copied": "تم النسخ ✓",
    "again": "فحص محتوى آخر",
    "required": "✅ الرد مطلوب",
    "none": "❌ لا حاجة للرد",
    "unclear": "⚠️ يحتاج إلى تحقق",
    "noCredits": "لا توجد أرصدة متبقية.",
    "buyCredits": "شراء أرصدة",
    "closePlans": "إغلاق الخطط",
    "choosePlan": "اختر الكمية التي تحتاجها",
    "starter": "أساسي",
    "popular": "الأكثر شيوعًا",
    "pro": "احترافي",
    "analyses": "تحليلات",
    "buy": "شراء",
    "openingPayment": "جارٍ فتح الدفع...",
    "paymentCancelled": "تم إلغاء الدفع.",
    "paymentReturn": "اكتمل الدفع. سيتم تحديث أرصدتك تلقائيًا.",
    "need": "أضف صورة أو PDF أو نصًا.",
    "max": "يمكنك اختيار ما يصل إلى 6 ملفات.",
    "disclaimer": "شرح الذكاء الاصطناعي ليس نصيحة رسمية قانونية أو طبية أو مالية أو حكومية. تحقق من المواعيد والمتطلبات المهمة.",
    "support": "الدعم",
    "admin": "المسؤول",
    "privacy": "الخصوصية",
    "terms": "الشروط",
    "refunds": "الاسترداد",
    "contact": "اتصل بنا",
    "upload": "ارفع مستندًا",
    "understand": "افهمه بوضوح",
    "next": "اعرف الخطوة التالية",
    "replyCreate": "أنشئ ردًا عند الحاجة",
    "anywhere": "أي مستند · في أي مكان · بأي لغة"
  },
  "hi": {
    "hero": "किसी भी दस्तावेज़ को, कहीं भी समझें।",
    "intro": "सरकारी, बैंकिंग, स्वास्थ्य, शिक्षा, कानूनी, बीमा, रोजगार या अनुबंध दस्तावेज़ अपलोड करें। NowWhat उसे सरल भाषा में समझाता है और अगला कदम बताता है।",
    "start": "मेरा दस्तावेज़ देखें",
    "free": "नए उपयोगकर्ताओं को 3 मुफ्त क्रेडिट मिलते हैं",
    "examples": "देखें परिणाम कैसा दिखता है",
    "examplesSub": "वास्तविक उदाहरण कुछ ही सेकंड में NowWhat का उपयोग दिखाते हैं।",
    "what": "यह क्या है?",
    "action": "मुझे अभी क्या करना चाहिए?",
    "deadline": "कब तक?",
    "reply": "क्या मुझे जवाब देना है?",
    "loginTitle": "मुफ्त शुरू करें",
    "loginText": "Google से साइन इन करें, 3 मुफ्त क्रेडिट पाएं और अपना बैलेंस सुरक्षित रखें।",
    "google": "Google से मुफ्त शुरू करें",
    "back": "परिचय पर वापस जाएं",
    "welcome": "नमस्ते",
    "credits": "बचे हुए क्रेडिट",
    "logout": "साइन आउट",
    "appLanguage": "ऐप की भाषा",
    "resultLanguage": "परिणाम की भाषा",
    "camera": "फोटो लें",
    "gallery": "स्क्रीनशॉट चुनें",
    "pdf": "PDF जोड़ें",
    "direct": "टेक्स्ट लिखें",
    "placeholder": "संदेश, ईमेल या पत्र पेस्ट करें...",
    "analyze": "मुझे क्या करना चाहिए?",
    "checking": "जांच हो रही है...",
    "make": "जवाब लिखें",
    "making": "जवाब बनाया जा रहा है...",
    "suggested": "सुझाया गया जवाब",
    "meaning": "इस जवाब का अर्थ",
    "copy": "जवाब कॉपी करें",
    "copied": "कॉपी हो गया ✓",
    "again": "कुछ और देखें",
    "required": "✅ जवाब आवश्यक",
    "none": "❌ जवाब आवश्यक नहीं",
    "unclear": "⚠️ जांच आवश्यक",
    "noCredits": "आपके पास क्रेडिट नहीं हैं।",
    "buyCredits": "क्रेडिट खरीदें",
    "closePlans": "योजनाएं बंद करें",
    "choosePlan": "ज़रूरत के अनुसार चुनें",
    "starter": "स्टार्टर",
    "popular": "लोकप्रिय",
    "pro": "प्रो",
    "analyses": "विश्लेषण",
    "buy": "खरीदें",
    "openingPayment": "भुगतान पेज खुल रहा है...",
    "paymentCancelled": "भुगतान रद्द कर दिया गया।",
    "paymentReturn": "भुगतान पूरा हुआ। आपके क्रेडिट अपने आप अपडेट होंगे।",
    "need": "फोटो, PDF या टेक्स्ट जोड़ें।",
    "max": "आप अधिकतम 6 फाइलें चुन सकते हैं।",
    "disclaimer": "यह AI व्याख्या आधिकारिक कानूनी, चिकित्सा, वित्तीय या सरकारी सलाह नहीं है। महत्वपूर्ण समयसीमा और जमा विवरण दोबारा जांचें।",
    "support": "सहायता",
    "admin": "एडमिन",
    "privacy": "गोपनीयता",
    "terms": "शर्तें",
    "refunds": "रिफंड",
    "contact": "संपर्क",
    "upload": "दस्तावेज़ अपलोड करें",
    "understand": "स्पष्ट रूप से समझें",
    "next": "अगला कदम जानें",
    "replyCreate": "ज़रूरत पर जवाब बनाएं",
    "anywhere": "कोई भी दस्तावेज़ · कहीं भी · किसी भी भाषा में"
  },
  "vi": {
    "hero": "Hiểu mọi tài liệu, ở bất cứ đâu.",
    "intro": "Tải lên tài liệu chính phủ, ngân hàng, y tế, giáo dục, pháp lý, bảo hiểm, việc làm hoặc hợp đồng. NowWhat giải thích rõ ràng và cho bạn biết bước tiếp theo.",
    "start": "Kiểm tra tài liệu",
    "free": "Người dùng mới nhận 3 tín dụng miễn phí",
    "examples": "Xem kết quả thực tế",
    "examplesSub": "Ví dụ thực tế cho thấy NowWhat hoạt động trong vài giây.",
    "what": "Đây là gì?",
    "action": "Tôi cần làm gì bây giờ?",
    "deadline": "Hạn chót là khi nào?",
    "reply": "Tôi có cần trả lời không?",
    "loginTitle": "Bắt đầu miễn phí",
    "loginText": "Đăng nhập bằng Google để nhận 3 tín dụng miễn phí và lưu số dư an toàn.",
    "google": "Bắt đầu miễn phí với Google",
    "back": "Quay lại phần giới thiệu",
    "welcome": "Xin chào",
    "credits": "Tín dụng còn lại",
    "logout": "Đăng xuất",
    "appLanguage": "Ngôn ngữ ứng dụng",
    "resultLanguage": "Ngôn ngữ kết quả",
    "camera": "Chụp ảnh",
    "gallery": "Chọn ảnh chụp màn hình",
    "pdf": "Đính kèm PDF",
    "direct": "Nhập văn bản",
    "placeholder": "Dán tin nhắn, email hoặc thư...",
    "analyze": "Tôi nên làm gì?",
    "checking": "Đang phân tích...",
    "make": "Tạo câu trả lời",
    "making": "Đang tạo câu trả lời...",
    "suggested": "Câu trả lời đề xuất",
    "meaning": "Ý nghĩa của câu trả lời",
    "copy": "Sao chép câu trả lời",
    "copied": "Đã sao chép ✓",
    "again": "Kiểm tra nội dung khác",
    "required": "✅ Cần trả lời",
    "none": "❌ Không cần trả lời",
    "unclear": "⚠️ Cần kiểm tra",
    "noCredits": "Bạn đã hết tín dụng.",
    "buyCredits": "Mua tín dụng",
    "closePlans": "Đóng gói",
    "choosePlan": "Chọn số lượng bạn cần",
    "starter": "Cơ bản",
    "popular": "Phổ biến",
    "pro": "Pro",
    "analyses": "lần phân tích",
    "buy": "Mua",
    "openingPayment": "Đang mở thanh toán...",
    "paymentCancelled": "Thanh toán đã bị hủy.",
    "paymentReturn": "Thanh toán hoàn tất. Tín dụng sẽ tự động cập nhật.",
    "need": "Thêm ảnh, PDF hoặc văn bản.",
    "max": "Bạn có thể chọn tối đa 6 tệp.",
    "disclaimer": "Giải thích AI không phải tư vấn chính thức về pháp lý, y tế, tài chính hoặc chính phủ. Hãy kiểm tra lại thời hạn và yêu cầu quan trọng.",
    "support": "Hỗ trợ",
    "admin": "Quản trị",
    "privacy": "Quyền riêng tư",
    "terms": "Điều khoản",
    "refunds": "Hoàn tiền",
    "contact": "Liên hệ",
    "upload": "Tải tài liệu lên",
    "understand": "Hiểu rõ nội dung",
    "next": "Biết bước tiếp theo",
    "replyCreate": "Tạo câu trả lời khi cần",
    "anywhere": "MỌI TÀI LIỆU · MỌI NƠI · MỌI NGÔN NGỮ"
  },
  "th": {
    "hero": "เข้าใจเอกสารทุกประเภทได้จากทุกที่",
    "intro": "อัปโหลดเอกสารราชการ ธนาคาร การแพทย์ การศึกษา กฎหมาย ประกัน การจ้างงาน หรือสัญญา NowWhat จะอธิบายอย่างชัดเจนและบอกขั้นตอนต่อไป",
    "start": "ตรวจสอบเอกสารของฉัน",
    "free": "ผู้ใช้ใหม่ได้รับเครดิตฟรี 3 เครดิต",
    "examples": "ดูตัวอย่างผลลัพธ์จริง",
    "examplesSub": "ตัวอย่างจริงแสดงให้เห็นว่า NowWhat ทำอะไรได้ในไม่กี่วินาที",
    "what": "นี่คืออะไร?",
    "action": "ฉันควรทำอะไรตอนนี้?",
    "deadline": "ภายในเมื่อไร?",
    "reply": "ต้องตอบกลับไหม?",
    "loginTitle": "เริ่มใช้ฟรี",
    "loginText": "เข้าสู่ระบบด้วย Google เพื่อรับเครดิตฟรี 3 เครดิตและบันทึกยอดอย่างปลอดภัย",
    "google": "เริ่มใช้ฟรีด้วย Google",
    "back": "กลับไปหน้าคำแนะนำ",
    "welcome": "สวัสดี",
    "credits": "เครดิตคงเหลือ",
    "logout": "ออกจากระบบ",
    "appLanguage": "ภาษาแอป",
    "resultLanguage": "ภาษาผลลัพธ์",
    "camera": "ถ่ายรูป",
    "gallery": "เลือกภาพหน้าจอ",
    "pdf": "แนบ PDF",
    "direct": "ป้อนข้อความ",
    "placeholder": "วางข้อความ อีเมล หรือจดหมาย...",
    "analyze": "ฉันควรทำอะไร?",
    "checking": "กำลังตรวจสอบ...",
    "make": "สร้างคำตอบ",
    "making": "กำลังสร้างคำตอบ...",
    "suggested": "คำตอบที่แนะนำ",
    "meaning": "ความหมายของคำตอบนี้",
    "copy": "คัดลอกคำตอบ",
    "copied": "คัดลอกแล้ว ✓",
    "again": "ตรวจสอบเนื้อหาอื่น",
    "required": "✅ ต้องตอบกลับ",
    "none": "❌ ไม่ต้องตอบกลับ",
    "unclear": "⚠️ ต้องตรวจสอบ",
    "noCredits": "เครดิตของคุณหมดแล้ว",
    "buyCredits": "ซื้อเครดิต",
    "closePlans": "ปิดแพ็กเกจ",
    "choosePlan": "เลือกจำนวนที่ต้องการ",
    "starter": "เริ่มต้น",
    "popular": "ยอดนิยม",
    "pro": "โปร",
    "analyses": "ครั้ง",
    "buy": "ซื้อ",
    "openingPayment": "กำลังเปิดหน้าชำระเงิน...",
    "paymentCancelled": "ยกเลิกการชำระเงินแล้ว",
    "paymentReturn": "ชำระเงินสำเร็จ เครดิตจะอัปเดตอัตโนมัติ",
    "need": "เพิ่มรูปภาพ PDF หรือข้อความ",
    "max": "เลือกได้สูงสุด 6 ไฟล์",
    "disclaimer": "คำอธิบายจาก AI ไม่ใช่คำแนะนำทางกฎหมาย การแพทย์ การเงิน หรือรัฐบาลอย่างเป็นทางการ โปรดตรวจสอบกำหนดเวลาและข้อกำหนดสำคัญ",
    "support": "ฝ่ายช่วยเหลือ",
    "admin": "ผู้ดูแล",
    "privacy": "ความเป็นส่วนตัว",
    "terms": "ข้อกำหนด",
    "refunds": "การคืนเงิน",
    "contact": "ติดต่อ",
    "upload": "อัปโหลดเอกสาร",
    "understand": "เข้าใจอย่างชัดเจน",
    "next": "รู้ว่าต้องทำอะไรต่อ",
    "replyCreate": "สร้างคำตอบเมื่อจำเป็น",
    "anywhere": "ทุกเอกสาร · ทุกที่ · ทุกภาษา"
  }
};

const EXAMPLES = {
  ko: [
    {
      icon: "🏛️",
      title: "정부기관 편지",
      source: "Please submit a copy of your DD214 by August 10.",
      what: "군 복무 임금을 확인하기 위해 DD214를 요청하는 편지입니다.",
      action: "DD214 사본을 준비해서 제출하세요.",
      deadline: "8월 10일까지",
      reply: "제출 후 짧은 확인 답장을 보내는 것이 좋습니다."
    },
    {
      icon: "🏫",
      title: "학교 이메일",
      source: "We still need proof of residency and immunization records.",
      what: "학교 등록을 완료하려면 두 가지 서류가 더 필요하다는 이메일입니다.",
      action: "거주 증명과 예방접종 기록을 학교에 보내세요.",
      deadline: "원문에 정해진 날짜 없음",
      reply: "서류를 준비하겠다고 답장하는 것이 좋습니다."
    },
    {
      icon: "🏥",
      title: "병원 청구서",
      source: "Please wait until your insurance claim is processed.",
      what: "현재 금액이 최종 본인 부담금이 아닐 수 있다는 안내입니다.",
      action: "보험 처리가 끝날 때까지 바로 결제하지 말고 기다리세요.",
      deadline: "즉시 해야 할 기한 없음",
      reply: "답장은 필요하지 않습니다."
    }
  ],
  en: [
    {
      icon: "🏛️",
      title: "Government letter",
      source: "Please submit a copy of your DD214 by August 10.",
      what: "The agency is requesting a DD214 to verify military wages.",
      action: "Prepare and submit a copy of the DD214.",
      deadline: "By August 10",
      reply: "A short confirmation after submission is recommended."
    },
    {
      icon: "🏫",
      title: "School email",
      source: "We still need proof of residency and immunization records.",
      what: "Two documents are still needed to complete enrollment.",
      action: "Send proof of residency and immunization records.",
      deadline: "No deadline shown",
      reply: "Reply to confirm that you will prepare the documents."
    },
    {
      icon: "🏥",
      title: "Medical bill",
      source: "Please wait until your insurance claim is processed.",
      what: "The current amount may not be your final responsibility.",
      action: "Wait for insurance processing before paying.",
      deadline: "No immediate deadline",
      reply: "No reply is needed."
    }
  ]
};

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">💬</span>
      <div>
        <strong>NowWhat</strong>
        <small>Know what to do next.</small>
      </div>
    </div>
  );
}

function ResultCard({ title, children, accent = false }) {
  return (
    <section className={`result-card ${accent ? "accent" : ""}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  const {
    appLanguage,
    setAppLanguage,
    languageReady
  } = useAppLanguage();
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("intro");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [credits, setCredits] = useState(null);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [replyData, setReplyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState("");
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (!languageReady) return;

    const savedResultLanguage =
      window.localStorage.getItem(
        "nowwhat_result_language"
      );

    setLang(savedResultLanguage || appLanguage);
  }, [languageReady, appLanguage]);

  useEffect(() => {
    if (languageReady) {
      window.localStorage.setItem(
        "nowwhat_result_language",
        lang
      );
    }
  }, [lang, languageReady]);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const pdfRef = useRef(null);

  const t = COPY[appLanguage] || COPY.en;
  const examples = EXAMPLES[lang] || EXAMPLES.en;

  useEffect(() => {
    let stopCredits = null;

    const stopAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (stopCredits) {
        stopCredits();
        stopCredits = null;
      }

      setUser(currentUser);
      setCredits(null);

      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
          stopCredits = watchCredits(currentUser.uid, setCredits);
        } catch (authError) {
          console.error(authError);
          setError(
            lang === "ko"
              ? "사용자 정보를 불러오지 못했습니다. Firebase 설정을 확인해 주세요."
              : "We could not load your user profile."
          );
        }
      }

      setAuthReady(true);
    });

    return () => {
      stopAuth();
      if (stopCredits) stopCredits();
    };
  }, [lang]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    if (checkout === "success") {
      setError(t.paymentReturn);
      setScreen(user ? "app" : "login");
    }

    if (checkout === "cancelled") {
      setError(t.paymentCancelled);
      setScreen(user ? "app" : "login");
    }
  }, [user, t.paymentCancelled, t.paymentReturn]);

  async function login() {
    setError("");

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(credential.user);
      setScreen("app");
    } catch (loginError) {
      console.error(loginError);
      setError(
        lang === "ko"
          ? "Google 로그인 중 문제가 발생했습니다. 다시 시도해 주세요."
          : "Google sign-in failed. Please try again."
      );
    }
  }

  async function logout() {
    await signOut(auth);
    reset();
    setScreen("intro");
  }

  function begin() {
    setError("");
    setScreen(user ? "app" : "login");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addFiles(fileList) {
    const merged = [...files, ...Array.from(fileList || [])];

    if (merged.length > 6) {
      setError(t.max);
      return;
    }

    setFiles(
      merged.filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.type === "application/pdf"
      )
    );
    setError("");
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  function reset() {
    setFiles([]);
    setText("");
    setResult(null);
    setReplyData(null);
    setError("");
    setCopied(false);
  }

  async function buyCredits(plan) {
    if (!user) {
      setScreen("login");
      return;
    }

    setPurchaseLoading(String(plan));
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: String(plan),
          uid: user.uid,
          email: user.email || ""
        })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Could not open checkout."
        );
      }

     await Browser.open({
  url: data.url
});
    } catch (purchaseError) {
      console.error(purchaseError);
      setError(
        purchaseError.message ||
          "Could not open checkout."
      );
      setPurchaseLoading("");
    }
  }

  async function analyze() {
    if (!user) {
      setScreen("login");
      return;
    }

    if (!files.length && !text.trim()) {
      setError(t.need);
      return;
    }

    if (credits === null) {
      setError(lang === "ko" ? "크레딧을 불러오는 중입니다." : "Loading credits.");
      return;
    }

    if (credits < 1) {
      setError(t.noCredits);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setReplyData(null);

    try {
      const formData = new FormData();
      formData.append("language", lang);
      formData.append("text", text.trim());
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      await consumeOneCredit(user.uid);
      setResult(data);
    } catch (analysisError) {
      console.error(analysisError);
      setError(
        analysisError.message === "NO_CREDITS"
          ? t.noCredits
          : analysisError.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function makeReply() {
    if (!result) return;

    setReplyLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          originalLanguage: result.original_language,
          summary: result.what_is_it,
          action: result.action,
          replyContext: result.reply_reason
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reply generation failed.");
      }

      setReplyData(data);
    } catch (replyError) {
      setError(replyError.message);
    } finally {
      setReplyLoading(false);
    }
  }

  async function copyReply() {
    if (!replyData?.reply) return;
    await navigator.clipboard.writeText(replyData.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!authReady) {
    return (
      <main className="loading-screen">
        <Brand />
        <div className="loading-dot" />
      </main>
    );
  }

  if (screen === "intro") {
    return (
      <main className="landing-page">
        <nav className="top-nav">
          <Brand />
          <select
            value={appLanguage}
            onChange={(e) =>
              setAppLanguage(e.target.value)
            }
            aria-label={t.appLanguage}
          >
            {LANGS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </nav>

        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">GLOBAL AI DOCUMENT ASSISTANT</span>
            <h1>{t.hero}</h1>
            <p>{t.intro}</p>

            <div className="benefits global-benefits">
              <span>📄 {t.upload}</span>
              <span>💡 {t.understand}</span>
              <span>✅ {t.next}</span>
              <span>✉️ {t.replyCreate}</span>
            </div>

            <button className="primary-button" onClick={begin}>
              {t.start} →
            </button>
            <small className="free-note">🎁 {t.free}</small>
          </div>

          <div className="hero-demo">
            <div className="document-preview">
              <span>📄 Received document</span>
              <i />
              <i />
              <i />
            </div>
            <ResultCard title={`💡 ${t.what}`}>
              <p>{examples[1].what}</p>
            </ResultCard>
            <ResultCard title={`✅ ${t.action}`} accent>
              <p>{examples[1].action}</p>
            </ResultCard>
          </div>
        </section>

        <section className="examples-section">
          <div className="section-heading">
            <span>REAL EXAMPLES</span>
            <h2>{t.examples}</h2>
            <p>{t.examplesSub}</p>
          </div>

          <div className="example-grid">
            {examples.map((example) => (
              <article className="example-card" key={example.title}>
                <h3>
                  {example.icon} {example.title}
                </h3>
                <div className="source-box">
                  <small>RECEIVED CONTENT</small>
                  <p>{example.source}</p>
                </div>
                <div className="example-result">
                  <p>
                    <b>💡 {t.what}</b>
                    {example.what}
                  </p>
                  <p className="example-action">
                    <b>✅ {t.action}</b>
                    {example.action}
                  </p>
                  <p>
                    <b>📅 {t.deadline}</b>
                    {example.deadline}
                  </p>
                  <p>
                    <b>✉️ {t.reply}</b>
                    {example.reply}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="document-types global-document-types">
          <div className="section-heading">
            <span>GLOBAL DOCUMENT SUPPORT</span>
            <h2>
              {lang === "ko"
                ? "어느 나라에서 받은 문서든 확인하세요"
                : "Documents from every part of life"}
            </h2>
            <p>
              {lang === "ko"
                ? "특정 국가나 기관에 한정되지 않습니다. 일상에서 받는 거의 모든 문서를 이해할 수 있도록 도와드립니다."
                : "Not limited to one country or institution. NowWhat helps with documents you receive in everyday life."}
            </p>
          </div>

          <div>
            <span>🏛 {lang === "ko" ? "정부" : "Government"}</span>
            <span>🏦 {lang === "ko" ? "은행·금융" : "Banking & Finance"}</span>
            <span>🏥 {lang === "ko" ? "의료·병원" : "Healthcare"}</span>
            <span>🎓 {lang === "ko" ? "학교·교육" : "Education"}</span>
            <span>⚖️ {lang === "ko" ? "법률" : "Legal"}</span>
            <span>🛡 {lang === "ko" ? "보험" : "Insurance"}</span>
            <span>💼 {lang === "ko" ? "직장·고용" : "Employment"}</span>
            <span>📝 {lang === "ko" ? "계약서" : "Contracts"}</span>
            <span>🏠 {lang === "ko" ? "주거·임대" : "Housing & Rental"}</span>
            <span>📑 {lang === "ko" ? "세금·재정" : "Tax & Financial"}</span>
            <span>✈️ {lang === "ko" ? "여행·이민" : "Travel & Immigration"}</span>
            <span>📬 {lang === "ko" ? "편지·공지" : "Letters & Notices"}</span>
          </div>
        </section>

        <section className="bottom-cta">
          <div>
            <small>NowWhat</small>
            <h2>
              {lang === "ko"
                ? "이제 무엇을 해야 하는지 바로 확인하세요."
                : "Understand it. Then know what to do next."}
            </h2>
            <p>🎁 {t.free}</p>
          </div>
          <button className="primary-button" onClick={begin}>
            {t.start} →
          </button>
        </section>

        <footer className="landing-footer">
          <Brand />
          <nav className="legal-links">
            <a href="/privacy">{t.privacy}</a>
            <a href="/terms">{t.terms}</a>
            <a href="/refund-policy">{t.refunds}</a>
            <a href="/contact">{t.contact}</a>
          </nav>
          <small>© 2026 NowWhat. All rights reserved.</small>
        </footer>
      </main>
    );
  }

  if (screen === "login") {
    return (
      <main className="login-page">
        <section className="login-card">
          <button className="back-button" onClick={() => setScreen("intro")}>←</button>
          <Brand />
          <h1>{t.loginTitle}</h1>
          <p>{t.loginText}</p>
          <button className="google-button" onClick={login}>
            <span>G</span>
            {t.google}
          </button>
          <small>🎁 {t.free}</small>
          {error && <p className="error-message">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-page" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="app-shell">
        <header className="user-bar">
          <Brand />
          <div className="user-info">
            <div>
              <small>{t.welcome}</small>
              <strong>{user?.displayName || user?.email}</strong>
            </div>
            <span className="credit-pill">
              {t.credits}: <b>{credits ?? "..."}</b>
            </span>
            <button
              className="buy-credit-link"
              onClick={() => {
                const next = !showPricing;
                setShowPricing(next);

                if (next) {
                  setTimeout(() => {
                    document
                      .getElementById("pricing")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                  }, 50);
                }
              }}
            >
              💎{" "}
              {showPricing ? t.closePlans : t.buyCredits}
            </button>
            <a href="/support" className="support-link">
              💬 {t.support}
            </a>
            {user?.email?.toLowerCase() ===
              String(process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
                .trim()
                .toLowerCase() && (
              <a
                href="/admin"
                className="admin-link"
              >
                ⚙️ {t.admin}
              </a>
            )}
            <button onClick={logout}>{t.logout}</button>
          </div>
        </header>

        <section className="app-heading">
          <span className="eyebrow">{t.anywhere}</span>
          <h1>
            {lang === "ko"
              ? "문서를 이해하고, 다음 행동을 확인하세요."
              : "Understand it. Know what to do next."}
          </h1>
          <p>{t.intro}</p>
        </section>

        <section className="language-row dual-language-row">
          <label>
            <span>{t.appLanguage}</span>
            <select
              value={appLanguage}
              onChange={(e) =>
                setAppLanguage(e.target.value)
              }
            >
              {LANGS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{t.resultLanguage}</span>
            <select
              value={lang}
              onChange={(e) =>
                setLang(e.target.value)
              }
            >
              {LANGS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="upload-grid">
          <button onClick={() => cameraRef.current?.click()}>
            <span>📸</span>
            <strong>{t.camera}</strong>
          </button>
          <button onClick={() => galleryRef.current?.click()}>
            <span>🖼️</span>
            <strong>{t.gallery}</strong>
          </button>
          <button onClick={() => pdfRef.current?.click()}>
            <span>📎</span>
            <strong>{t.pdf}</strong>
          </button>
        </section>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />

        {files.length > 0 && (
          <section className="selected-files">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`}>
                <span>{file.type === "application/pdf" ? "📄" : "🖼️"}</span>
                <strong>{file.name}</strong>
                <button onClick={() => removeFile(index)}>×</button>
              </div>
            ))}
          </section>
        )}

        <section className="text-input-card">
          <label>{t.direct}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
            maxLength={12000}
          />
        </section>

        <button
          className="primary-button full-button"
          onClick={analyze}
          disabled={loading}
        >
          {loading ? t.checking : `✨ ${t.analyze}`}
        </button>

        {error && <p className="error-message">{error}</p>}

        {result && (
          <section className="results-section">
            <ResultCard title={`💡 ${t.what}`}>
              <p>{result.what_is_it}</p>
            </ResultCard>

            <ResultCard title={`✅ ${t.action}`} accent>
              {result.action_items?.length > 1 ? (
                <ol>
                  {result.action_items.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p>{result.action}</p>
              )}
            </ResultCard>

            <ResultCard title={`📅 ${t.deadline}`}>
              <p className="deadline-text">{result.deadline}</p>
            </ResultCard>

            <ResultCard title={`✉️ ${t.reply}`}>
              <span className={`reply-status ${result.reply_status}`}>
                {result.reply_status === "required"
                  ? t.required
                  : result.reply_status === "not_required"
                    ? t.none
                    : t.unclear}
              </span>
              <p>{result.reply_reason}</p>

              {result.reply_status === "required" && (
                <button
                  className="secondary-button"
                  onClick={makeReply}
                  disabled={replyLoading}
                >
                  {replyLoading ? t.making : t.make}
                </button>
              )}
            </ResultCard>

            {result.warning && (
              <div className="warning-box">⚠️ {result.warning}</div>
            )}

            {replyData && (
              <ResultCard title={`✉️ ${t.suggested}`}>
                <pre>{replyData.reply}</pre>
                <button className="secondary-button" onClick={copyReply}>
                  {copied ? t.copied : t.copy}
                </button>
                <div className="reply-divider" />
                <h3>🌐 {t.meaning}</h3>
                <div className="translation-box">{replyData.translation}</div>
              </ResultCard>
            )}

            <button className="reset-button" onClick={reset}>
              {t.again}
            </button>
          </section>
        )}

        {showPricing && (
          <section className="pricing-section" id="pricing">
          <div className="pricing-heading">
            <span>NOWWHAT CREDITS</span>
            <h2>💎 {t.buyCredits}</h2>
            <p>{t.choosePlan}</p>
          </div>

          <div className="pricing-grid">
            <article className="price-card">
              <small>{t.starter}</small>
              <strong>10</strong>
              <span>{t.analyses}</span>
              <h3>$1.99</h3>
              <button
                onClick={() => buyCredits(10)}
                disabled={Boolean(purchaseLoading)}
              >
                {purchaseLoading === "10"
                  ? t.openingPayment
                  : t.buy}
              </button>
            </article>

            <article className="price-card featured">
              <div className="popular-badge">
                ⭐ {t.popular}
              </div>
              <small>Popular</small>
              <strong>30</strong>
              <span>{t.analyses}</span>
              <h3>$4.99</h3>
              <button
                onClick={() => buyCredits(30)}
                disabled={Boolean(purchaseLoading)}
              >
                {purchaseLoading === "30"
                  ? t.openingPayment
                  : t.buy}
              </button>
            </article>

            <article className="price-card">
              <small>{t.pro}</small>
              <strong>100</strong>
              <span>{t.analyses}</span>
              <h3>$9.99</h3>
              <button
                onClick={() => buyCredits(100)}
                disabled={Boolean(purchaseLoading)}
              >
                {purchaseLoading === "100"
                  ? t.openingPayment
                  : t.buy}
              </button>
            </article>
          </div>

          <p className="pricing-note">
            {lang === "ko"
              ? "분석 1회에 크레딧 1개가 사용되며 답장과 번역은 포함됩니다."
              : "One credit is used per analysis. Reply generation and translation are included."}
          </p>
          </section>
        )}

        <footer className="app-footer">
          <p>{t.disclaimer}</p>
          <nav className="legal-links">
            <a href="/privacy">{t.privacy}</a>
            <a href="/terms">{t.terms}</a>
            <a href="/refund-policy">{t.refunds}</a>
            <a href="/contact">{t.contact}</a>
          </nav>
          <small>© 2026 NowWhat</small>
        </footer>
      </div>
    </main>
  );
}
