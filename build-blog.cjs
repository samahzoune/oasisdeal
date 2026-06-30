/* OasisDeal editorial blog generator.
   /blog hub + in-depth articles (EN/FR/AR, separate URLs + hreflang).
   Each article: feature image (reuses images/destinations/<img>.jpg when set,
   else a branded SVG banner), category + date meta, multi-section body (or a
   tips list), BlogPosting + (optional FAQ) schema, and a CTA into the funnel
   (flights / rights / eSIM / destinations). Run: node build-blog.cjs */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const PUB = '2026-06-29';

// cat keys: flights / rights / esim / umrah / guide
const ART = [
  {slug:'cheapest-time-to-book-flights-from-morocco', cat:'flights', img:'istanbul', date:PUB,
   title:{en:'When Is the Cheapest Time to Book Flights from Morocco?', fr:'Quand réserver les vols les moins chers depuis le Maroc ?', ar:'متى تحجز أرخص الرحلات من المغرب؟'},
   desc:{en:'How far ahead to book, the cheapest days to fly, and the seasons to avoid for the lowest fares from Morocco.', fr:'À quel moment réserver, les jours les moins chers pour voler et les saisons à éviter pour les meilleurs tarifs depuis le Maroc.', ar:'متى تحجز، وأرخص الأيام للسفر، والمواسم التي يُفضّل تجنّبها للحصول على أقل الأسعار من المغرب.'},
   lead:{en:'Flight prices from Morocco swing a lot depending on when you book and when you fly. Get the timing right and the same seat can cost far less — here’s what actually moves the price.', fr:'Les prix des vols depuis le Maroc varient beaucoup selon le moment où vous réservez et où vous partez. Avec le bon timing, le même siège coûte bien moins cher — voici ce qui fait vraiment bouger le prix.', ar:'تتقلّب أسعار الرحلات من المغرب كثيرًا حسب وقت الحجز ووقت السفر. مع التوقيت الصحيح، قد يكلّف المقعد نفسه أقل بكثير — وإليك ما يحرّك السعر فعلًا.'},
   secs:[
     {h:{en:'Book 4–8 weeks ahead for international flights', fr:'Réservez 4 à 8 semaines à l’avance pour l’international', ar:'احجز قبل 4–8 أسابيع للرحلات الدولية'},
      p:{en:'For Morocco–Europe and Gulf routes, the sweet spot is usually four to eight weeks before departure. Last-minute almost always costs more, and booking six months out rarely beats it. For domestic hops, two to three weeks is plenty.', fr:'Pour les lignes Maroc–Europe et Golfe, la fenêtre idéale se situe généralement entre quatre et huit semaines avant le départ. La dernière minute coûte presque toujours plus cher, et réserver six mois à l’avance fait rarement mieux. Pour les vols intérieurs, deux à trois semaines suffisent.', ar:'في خطوط المغرب–أوروبا والخليج، تكون الفترة المثالية عادةً من أربعة إلى ثمانية أسابيع قبل المغادرة. الحجز في اللحظة الأخيرة أغلى دائمًا تقريبًا، والحجز قبل ستة أشهر نادرًا ما يكون أفضل. أما الرحلات الداخلية فيكفيها أسبوعان إلى ثلاثة.'}},
     {h:{en:'Fly mid-week, avoid weekends and holidays', fr:'Volez en milieu de semaine, évitez week-ends et fêtes', ar:'سافر منتصف الأسبوع، وتجنّب العطل ونهايات الأسبوع'},
      p:{en:'Tuesday and Wednesday departures are typically cheapest; Friday and Sunday the priciest. Prices also spike hard around summer (June–August) and Eid, when the diaspora travels. Shifting your dates by even a few days often saves real money.', fr:'Les départs du mardi et du mercredi sont en général les moins chers ; le vendredi et le dimanche les plus chers. Les prix grimpent aussi fortement l’été (juin–août) et pendant l’Aïd, quand la diaspora voyage. Décaler vos dates de quelques jours suffit souvent à économiser.', ar:'عادةً ما تكون رحلات الثلاثاء والأربعاء الأرخص، والجمعة والأحد الأغلى. كما ترتفع الأسعار بشدّة في الصيف (يونيو–أغسطس) وفي العيد حين تسافر الجالية. وغالبًا ما يوفّر تغيير تواريخك بأيام قليلة مبلغًا حقيقيًا.'}},
     {h:{en:'Be flexible and compare everything', fr:'Soyez flexible et comparez tout', ar:'كن مرنًا وقارن كل شيء'},
      p:{en:'One search that compares hundreds of airlines and agencies side by side beats checking one airline at a time. Flexible dates, nearby airports (Casablanca vs Rabat, Tangier vs Nador) and one-way combinations can all cut the total.', fr:'Une seule recherche qui compare des centaines de compagnies et d’agences côte à côte vaut mieux que de vérifier une compagnie à la fois. Dates flexibles, aéroports proches (Casablanca ou Rabat, Tanger ou Nador) et combinaisons aller simple peuvent tous réduire la facture.', ar:'بحث واحد يقارن مئات الشركات والوكالات جنبًا إلى جنب أفضل من فحص شركة تلو الأخرى. المرونة في التواريخ، والمطارات القريبة (الدار البيضاء أو الرباط، طنجة أو الناظور)، وتركيبات الذهاب فقط — كلها قد تخفّض الإجمالي.'}},
   ],
   cta:{href:'/flights/', label:{en:'Compare flights from Morocco →', fr:'Comparer les vols depuis le Maroc →', ar:'قارن الرحلات من المغرب →'}, sub:{en:'Live fares, cheapest first.', fr:'Tarifs en direct, les moins chers d’abord.', ar:'أسعار مباشرة، الأرخص أولًا.'}}},

  {slug:'10-tips-to-find-cheap-flights-from-morocco', cat:'flights', img:'paris', date:PUB,
   title:{en:'10 Tips to Find Cheap Flights from Morocco', fr:'10 astuces pour trouver des vols pas chers depuis le Maroc', ar:'10 نصائح للعثور على رحلات رخيصة من المغرب'},
   desc:{en:'Ten habits that consistently lower the price of flights from Morocco — from timing to nearby airports.', fr:'Dix habitudes qui réduisent durablement le prix des vols depuis le Maroc — du timing aux aéroports proches.', ar:'عشر عادات تخفّض باستمرار سعر الرحلات من المغرب — من التوقيت إلى المطارات القريبة.'},
   lead:{en:'Finding a cheap fare isn’t luck — it’s a handful of habits. Here are ten that consistently lower the price of flights from Morocco.', fr:'Trouver un tarif bas n’est pas une question de chance — c’est une poignée d’habitudes. En voici dix qui réduisent régulièrement le prix des vols depuis le Maroc.', ar:'العثور على سعر رخيص ليس حظًّا — بل مجموعة عادات. إليك عشرًا منها تخفّض باستمرار سعر الرحلات من المغرب.'},
   tipsH:{en:'The ten tips', fr:'Les dix astuces', ar:'النصائح العشر'},
   tips:{en:['Compare every airline in one search, not one site at a time','Set your dates to mid-week (Tue/Wed)','Book 4–8 weeks ahead for international routes','Travel outside summer and Eid when you can','Check nearby airports — Casablanca, Rabat, Tangier, Agadir, Fes','Consider one-way tickets on two different airlines','Clear filters and sort cheapest-first','Be ready to book — the best fares don’t last','Travel light to avoid checked-baggage fees','Know your rights if a flight is delayed or cancelled'],
         fr:['Comparez toutes les compagnies en une recherche, pas une par une','Choisissez des dates en milieu de semaine (mar./mer.)','Réservez 4 à 8 semaines à l’avance pour l’international','Voyagez hors été et Aïd quand c’est possible','Vérifiez les aéroports proches — Casablanca, Rabat, Tanger, Agadir, Fès','Envisagez deux allers simples sur deux compagnies','Effacez les filtres et triez du moins cher au plus cher','Soyez prêt à réserver — les meilleurs tarifs ne durent pas','Voyagez léger pour éviter les frais de bagage en soute','Connaissez vos droits en cas de vol retardé ou annulé'],
         ar:['قارن كل الشركات في بحث واحد، لا واحدة تلو الأخرى','اختر تواريخ في منتصف الأسبوع (الثلاثاء/الأربعاء)','احجز قبل 4–8 أسابيع للرحلات الدولية','سافر خارج الصيف والعيد متى أمكن','تحقّق من المطارات القريبة — الدار البيضاء، الرباط، طنجة، أكادير، فاس','فكّر في تذكرتي ذهاب فقط على شركتين مختلفتين','امسح الفلاتر ورتّب من الأرخص إلى الأغلى','كن مستعدًّا للحجز — أفضل الأسعار لا تدوم','سافر بأمتعة خفيفة لتجنّب رسوم الحقائب','اعرف حقوقك إذا تأخرت رحلتك أو أُلغيت']},
   cta:{href:'/flights/', label:{en:'Find your cheapest route →', fr:'Trouvez votre trajet le moins cher →', ar:'اعثر على أرخص رحلاتك →'}, sub:{en:'Compare hundreds of airlines in one search.', fr:'Comparez des centaines de compagnies en une recherche.', ar:'قارن مئات الشركات في بحث واحد.'}}},

  {slug:'flight-delay-compensation-morocco-ec261', cat:'rights', img:'', date:PUB,
   title:{en:'Flight Delayed or Cancelled? Know Your EC 261 Rights', fr:'Vol retardé ou annulé ? Connaissez vos droits (EC 261)', ar:'رحلة متأخرة أو ملغاة؟ اعرف حقوقك (EC 261)'},
   desc:{en:'How much you can claim for a delayed, cancelled or overbooked flight under EU law — and when it covers Morocco flights.', fr:'Combien réclamer pour un vol retardé, annulé ou surréservé selon la loi européenne — et quand cela couvre les vols du Maroc.', ar:'كم يمكنك المطالبة به عن رحلة متأخرة أو ملغاة أو متجاوزة الحجز بموجب القانون الأوروبي — ومتى يشمل ذلك رحلات المغرب.'},
   lead:{en:'Most travellers never claim the money airlines owe them. If your flight was delayed, cancelled or overbooked, EU regulation EC 261 may entitle you to up to €600 — including on many flights to and from Morocco.', fr:'La plupart des voyageurs ne réclament jamais l’argent que leur doivent les compagnies. Si votre vol a été retardé, annulé ou surréservé, le règlement européen EC 261 peut vous donner droit à 600 € — y compris sur de nombreux vols de et vers le Maroc.', ar:'معظم المسافرين لا يطالبون أبدًا بالأموال التي تدين بها لهم شركات الطيران. إذا تأخرت رحلتك أو أُلغيت أو تعرّضت لتجاوز الحجز، فقد يمنحك قانون الاتحاد الأوروبي EC 261 حقًّا في ما يصل إلى 600 يورو — بما في ذلك كثير من رحلات المغرب.'},
   secs:[
     {h:{en:'What EC 261 covers', fr:'Ce que couvre EC 261', ar:'ما يشمله قانون EC 261'},
      p:{en:'EC 261 entitles passengers to between €250 and €600 for long delays (3+ hours), cancellations with short notice, and being denied boarding due to overbooking — when the airline is at fault. The exact amount depends on the flight distance.', fr:'EC 261 donne droit à une indemnité de 250 à 600 € pour les longs retards (3 h ou plus), les annulations à court préavis et le refus d’embarquement pour surréservation — lorsque la compagnie est responsable. Le montant exact dépend de la distance du vol.', ar:'يمنح قانون EC 261 الركّاب تعويضًا من 250 إلى 600 يورو عن التأخّر الطويل (3 ساعات أو أكثر)، والإلغاء بإشعار قصير، والمنع من الصعود بسبب تجاوز الحجز — عندما تكون الشركة مسؤولة. ويعتمد المبلغ على مسافة الرحلة.'}},
     {h:{en:'Does it apply to Morocco flights?', fr:'Cela s’applique-t-il aux vols du Maroc ?', ar:'هل ينطبق على رحلات المغرب؟'},
      p:{en:'It covers any flight departing an EU or UK airport on any airline, and flights arriving in Europe on a European airline. So a Casablanca–Paris on a European carrier is often covered, while a domestic flight or a Gulf route usually isn’t.', fr:'Il couvre tout vol au départ d’un aéroport de l’UE ou du Royaume-Uni, quelle que soit la compagnie, et les vols arrivant en Europe sur une compagnie européenne. Un Casablanca–Paris sur un transporteur européen est donc souvent couvert, contrairement à un vol intérieur ou une ligne du Golfe.', ar:'يشمل أي رحلة تقلع من مطار في الاتحاد الأوروبي أو بريطانيا على أي شركة، والرحلات الواصلة إلى أوروبا على شركة أوروبية. فرحلة الدار البيضاء–باريس على شركة أوروبية غالبًا ما تكون مشمولة، بينما لا تكون الرحلة الداخلية أو خط الخليج عادةً.'}},
     {h:{en:'How to claim — for free', fr:'Comment réclamer — gratuitement', ar:'كيف تطالب — مجانًا'},
      p:{en:'Keep your booking reference and flight number, check eligibility (it takes a couple of minutes and is free), and let a specialist handle the airline and paperwork. It’s no win, no fee — you only pay a success commission if the claim is paid out.', fr:'Conservez votre référence de réservation et votre numéro de vol, vérifiez votre éligibilité (gratuit, deux minutes) et laissez un spécialiste gérer la compagnie et les démarches. Sans gain, sans frais — vous ne payez une commission que si la réclamation aboutit.', ar:'احتفظ برقم الحجز ورقم الرحلة، وتحقّق من الأهلية (مجانًا وفي دقيقتين)، ودع مختصًّا يتولّى التعامل مع الشركة والأوراق. بلا ربح بلا رسوم — لا تدفع عمولة نجاح إلا إذا حصلت على التعويض.'}},
   ],
   cta:{href:'/flight-rights', label:{en:'Know your rights →', fr:'Connaître vos droits →', ar:'اعرف حقوقك →'}, sub:{en:'Free 30-second eligibility check.', fr:'Vérification d’éligibilité gratuite en 30 secondes.', ar:'فحص أهلية مجاني في 30 ثانية.'}}},

  {slug:'travel-esim-vs-roaming', cat:'esim', img:'', date:PUB,
   title:{en:'Travel eSIM vs Roaming: Stay Online Abroad for Less', fr:'eSIM voyage vs itinérance : rester connecté à l’étranger pour moins cher', ar:'eSIM السفر مقابل التجوال: ابقَ متصلًا في الخارج بأقل تكلفة'},
   desc:{en:'What a travel eSIM is, why it beats roaming on price, and how to set one up before you fly.', fr:'Ce qu’est une eSIM voyage, pourquoi elle bat l’itinérance sur le prix, et comment l’installer avant de partir.', ar:'ما هي eSIM السفر، ولماذا تتفوّق على التجوال في السعر، وكيف تجهّزها قبل السفر.'},
   lead:{en:'Coming home to a huge roaming bill is one of travel’s worst surprises. A travel eSIM fixes that: a local data plan you install in minutes, usually for a fraction of roaming.', fr:'Rentrer avec une facture d’itinérance énorme est l’une des pires surprises du voyage. Une eSIM voyage règle le problème : un forfait data local que vous installez en quelques minutes, souvent pour une fraction du prix de l’itinérance.', ar:'العودة إلى فاتورة تجوال ضخمة من أسوأ مفاجآت السفر. تحلّ eSIM السفر هذه المشكلة: باقة بيانات محلية تُركّبها في دقائق، وغالبًا بجزء بسيط من تكلفة التجوال.'},
   secs:[
     {h:{en:'What is a travel eSIM?', fr:'Qu’est-ce qu’une eSIM voyage ?', ar:'ما هي eSIM السفر؟'},
      p:{en:'An eSIM is a digital SIM you install by scanning a QR code — no plastic card. A travel eSIM gives you a local data plan abroad, so you skip expensive roaming and stay online from the moment you land. Your normal number keeps working for calls and texts.', fr:'Une eSIM est une carte SIM numérique que vous installez en scannant un QR code — sans carte plastique. Une eSIM voyage vous donne un forfait data local à l’étranger : vous évitez l’itinérance coûteuse et restez connecté dès l’atterrissage. Votre numéro habituel continue de fonctionner pour les appels et SMS.', ar:'eSIM شريحة رقمية تُركّبها بمسح رمز QR — دون بطاقة بلاستيكية. تمنحك eSIM السفر باقة بيانات محلية في الخارج، فتتجنّب التجوال الباهظ وتبقى متصلًا من لحظة الوصول. ويظلّ رقمك المعتاد يعمل للمكالمات والرسائل.'}},
     {h:{en:'Why it’s cheaper than roaming', fr:'Pourquoi c’est moins cher que l’itinérance', ar:'لماذا هي أرخص من التجوال'},
      p:{en:'Roaming bills your home rate plus a markup for every megabyte abroad. A travel eSIM is a flat local plan you buy upfront, so you know the price before you travel — often a few dollars for a week or more of data, with no bill shock when you get back.', fr:'L’itinérance facture votre tarif domestique majoré pour chaque mégaoctet à l’étranger. Une eSIM voyage est un forfait local fixe acheté d’avance : vous connaissez le prix avant de partir — souvent quelques dollars pour une semaine de data ou plus, sans mauvaise surprise au retour.', ar:'يحاسبك التجوال بسعر بلدك زائد هامش عن كل ميغابايت في الخارج. أما eSIM السفر فهي باقة محلية ثابتة تشتريها مسبقًا، فتعرف السعر قبل السفر — غالبًا بضعة دولارات لأسبوع من البيانات أو أكثر، دون صدمة فاتورة عند العودة.'}},
     {h:{en:'How to set one up', fr:'Comment l’installer', ar:'كيف تجهّزها'},
      p:{en:'Check your phone supports eSIM (most models since 2018 do), pick your destination and a plan, then scan the QR code you receive. Do it at home on Wi-Fi before you fly — it activates automatically when you arrive.', fr:'Vérifiez que votre téléphone gère l’eSIM (la plupart des modèles depuis 2018), choisissez votre destination et un forfait, puis scannez le QR code reçu. Faites-le chez vous en Wi-Fi avant de partir — l’activation se fait automatiquement à l’arrivée.', ar:'تأكّد أن هاتفك يدعم eSIM (معظم الطُرز منذ 2018)، اختر وجهتك وباقة، ثم امسح رمز QR الذي يصلك. افعل ذلك في بيتك عبر Wi-Fi قبل السفر — وتتفعّل تلقائيًا عند الوصول.'}},
   ],
   cta:{href:'/esim', label:{en:'Compare travel eSIMs →', fr:'Comparer les eSIM voyage →', ar:'قارن شرائح eSIM للسفر →'}, sub:{en:'Pick your country, see prices.', fr:'Choisissez votre pays, voyez les prix.', ar:'اختر بلدك، واعرف الأسعار.'}}},

  {slug:'umrah-from-morocco-guide', cat:'umrah', img:'jeddah', date:PUB,
   title:{en:'Umrah from Morocco: Flights, Best Time & Practical Tips', fr:'Omra depuis le Maroc : vols, meilleure période et conseils pratiques', ar:'العمرة من المغرب: الرحلات، أفضل وقت، ونصائح عملية'},
   desc:{en:'How to plan Umrah from Morocco — finding flights to Jeddah, the cheapest seasons, and practical tips for the trip.', fr:'Comment planifier la Omra depuis le Maroc — trouver des vols vers Djeddah, les saisons les moins chères et des conseils pratiques.', ar:'كيف تخطّط للعمرة من المغرب — إيجاد رحلات إلى جدة، وأرخص المواسم، ونصائح عملية للرحلة.'},
   lead:{en:'For many Moroccan travellers, Umrah is the trip of a lifetime — and a little planning keeps the cost down and the journey smooth. Here’s how to handle the flights and timing.', fr:'Pour de nombreux voyageurs marocains, la Omra est le voyage d’une vie — et un peu de planification réduit le coût et facilite le trajet. Voici comment gérer les vols et le timing.', ar:'بالنسبة لكثير من المسافرين المغاربة، العمرة رحلة العمر — وقليل من التخطيط يخفّض التكلفة ويجعل الرحلة سلسة. إليك كيف تتعامل مع الرحلات والتوقيت.'},
   secs:[
     {h:{en:'Flights: Jeddah is the gateway', fr:'Vols : Djeddah est la porte d’entrée', ar:'الرحلات: جدة هي البوابة'},
      p:{en:'Jeddah is the usual arrival point for Umrah, a short drive from Makkah. Direct and one-stop flights run from Casablanca; booking several weeks ahead and comparing every airline in one search gives you the best fare. Fares rise sharply in Ramadan and the Hajj season.', fr:'Djeddah est le point d’arrivée habituel pour la Omra, à courte distance de La Mecque. Des vols directs et avec une escale partent de Casablanca ; réserver plusieurs semaines à l’avance et comparer toutes les compagnies en une recherche donne le meilleur tarif. Les prix grimpent fortement pendant le Ramadan et la saison du Hajj.', ar:'جدة هي نقطة الوصول المعتادة للعمرة، وتبعد مسافة قصيرة عن مكة. تنطلق رحلات مباشرة وبتوقّف واحد من الدار البيضاء؛ والحجز قبل أسابيع ومقارنة كل الشركات في بحث واحد يمنحك أفضل سعر. وترتفع الأسعار بشدّة في رمضان وموسم الحج.'}},
     {h:{en:'Best time to go', fr:'Meilleure période', ar:'أفضل وقت للذهاب'},
      p:{en:'Outside Ramadan and Hajj, the cooler months (roughly November to March) are the most comfortable and usually the cheapest for flights. Mid-week departures and flexible dates help further.', fr:'Hors Ramadan et Hajj, les mois plus frais (de novembre à mars environ) sont les plus agréables et généralement les moins chers pour les vols. Les départs en milieu de semaine et des dates flexibles aident encore.', ar:'خارج رمضان والحج، تكون الأشهر الأبرد (تقريبًا من نوفمبر إلى مارس) الأكثر راحة وعادةً الأرخص للرحلات. وتساعد رحلات منتصف الأسبوع والتواريخ المرنة أكثر.'}},
     {h:{en:'Practical tips', fr:'Conseils pratiques', ar:'نصائح عملية'},
      p:{en:'Travel light, keep your documents together, and set up a travel eSIM before you fly so you can stay in touch with family without roaming charges. Confirm entry requirements through official sources before booking.', fr:'Voyagez léger, gardez vos documents ensemble et installez une eSIM voyage avant de partir pour rester en contact avec la famille sans frais d’itinérance. Vérifiez les conditions d’entrée auprès des sources officielles avant de réserver.', ar:'سافر بأمتعة خفيفة، واحتفظ بوثائقك معًا، وجهّز eSIM للسفر قبل المغادرة لتبقى على تواصل مع العائلة دون رسوم تجوال. وتأكّد من متطلّبات الدخول من المصادر الرسمية قبل الحجز.'}},
   ],
   cta:{href:'/flights/casablanca-jeddah', label:{en:'See Casablanca–Jeddah fares →', fr:'Voir les tarifs Casablanca–Djeddah →', ar:'اعرض أسعار الدار البيضاء–جدة →'}, sub:{en:'Live prices, cheapest first.', fr:'Prix en direct, les moins chers d’abord.', ar:'أسعار مباشرة، الأرخص أولًا.'}}},

  {slug:'best-time-to-visit-europe-from-morocco', cat:'guide', img:'barcelona', date:PUB,
   title:{en:'The Best Time to Visit Europe from Morocco', fr:'La meilleure période pour visiter l’Europe depuis le Maroc', ar:'أفضل وقت لزيارة أوروبا من المغرب'},
   desc:{en:'Spring, summer or autumn? When to visit Europe from Morocco for good weather, fewer crowds and cheaper flights.', fr:'Printemps, été ou automne ? Quand visiter l’Europe depuis le Maroc pour le beau temps, moins de foule et des vols moins chers.', ar:'الربيع أم الصيف أم الخريف؟ متى تزور أوروبا من المغرب لطقس جيد وازدحام أقل ورحلات أرخص.'},
   lead:{en:'Europe is a short hop from Morocco, but when you go changes everything — the weather, the crowds and the price of your flight. Here’s how to pick the right window.', fr:'L’Europe est à un saut du Maroc, mais le moment où vous partez change tout — la météo, la foule et le prix de votre vol. Voici comment choisir la bonne fenêtre.', ar:'أوروبا على بُعد قفزة قصيرة من المغرب، لكنّ وقت سفرك يغيّر كل شيء — الطقس، والازدحام، وسعر رحلتك. وإليك كيف تختار النافذة المناسبة.'},
   secs:[
     {h:{en:'Spring and autumn — the sweet spot', fr:'Printemps et automne — la période idéale', ar:'الربيع والخريف — الفترة المثالية'},
      p:{en:'April to June and September to October usually offer the best balance: mild weather, smaller crowds and lower fares than peak summer. Cities like Paris, Barcelona and Rome are at their most pleasant.', fr:'D’avril à juin et de septembre à octobre, on a généralement le meilleur équilibre : temps doux, moins de foule et tarifs plus bas qu’en plein été. Des villes comme Paris, Barcelone et Rome sont alors les plus agréables.', ar:'من أبريل إلى يونيو ومن سبتمبر إلى أكتوبر يكون التوازن عادةً في أفضل حالاته: طقس معتدل، وازدحام أقل، وأسعار أدنى من ذروة الصيف. ومدن مثل باريس وبرشلونة وروما تكون في أجمل أحوالها.'}},
     {h:{en:'Summer — sunny but busy and pricey', fr:'L’été — ensoleillé mais bondé et cher', ar:'الصيف — مشمس لكنه مزدحم وغالٍ'},
      p:{en:'July and August bring the warmest weather and long days, but also the biggest crowds and the highest flight prices — made worse by the diaspora travelling. If you must go in summer, book early and travel mid-week.', fr:'Juillet et août offrent le temps le plus chaud et de longues journées, mais aussi la plus grande foule et les vols les plus chers — accentués par les voyages de la diaspora. Si vous devez partir en été, réservez tôt et voyagez en milieu de semaine.', ar:'يجلب يوليو وأغسطس أدفأ طقس وأيامًا طويلة، لكن أيضًا أكبر زحام وأعلى أسعار للرحلات — ويزيدها سفر الجالية. وإن كان لا بدّ من السفر صيفًا، فاحجز مبكرًا وسافر في منتصف الأسبوع.'}},
     {h:{en:'Winter — deals and quiet cities', fr:'L’hiver — bons plans et villes calmes', ar:'الشتاء — عروض ومدن هادئة'},
      p:{en:'November to March is the cheapest time to fly and the quietest to sightsee. It’s cold and days are short, but city breaks, museums and festive markets shine — and fares are often a fraction of summer prices.', fr:'De novembre à mars, c’est la période la moins chère pour voler et la plus calme pour visiter. Il fait froid et les jours sont courts, mais les city-breaks, musées et marchés de fête brillent — et les tarifs sont souvent une fraction des prix d’été.', ar:'من نوفمبر إلى مارس، يكون الطيران الأرخص والزيارة الأهدأ. الجوّ بارد والأيام قصيرة، لكن العطل المدينية والمتاحف والأسواق الاحتفالية تتألّق — وغالبًا ما تكون الأسعار جزءًا بسيطًا من أسعار الصيف.'}},
   ],
   cta:{href:'/destinations/', label:{en:'Browse destinations →', fr:'Parcourir les destinations →', ar:'تصفّح الوجهات →'}, sub:{en:'Best time & live fares for each city.', fr:'Meilleure période et tarifs en direct par ville.', ar:'أفضل وقت وأسعار مباشرة لكل مدينة.'}}},

  {slug:'hand-luggage-rules-fly-carry-on-only', cat:'guide', img:'', date:PUB,
   title:{en:'Carry-On Only: Hand Luggage Rules & Packing Tips', fr:'Bagage cabine uniquement : règles et astuces de préparation', ar:'حقيبة يد فقط: قواعد الأمتعة ونصائح التحضير'},
   desc:{en:'How to fly carry-on only from Morocco: typical size and liquid rules, what to pack, and how to dodge baggage fees.', fr:'Comment voyager en cabine uniquement depuis le Maroc : tailles et règles sur les liquides, quoi emporter et comment éviter les frais de bagage.', ar:'كيف تسافر بحقيبة يد فقط من المغرب: المقاسات وقواعد السوائل، وماذا تحزم، وكيف تتجنّب رسوم الأمتعة.'},
   lead:{en:'Flying with just a carry-on is faster, cheaper and stress-free — no waiting at the belt, no baggage fees. A little planning makes it easy.', fr:'Voyager avec un seul bagage cabine est plus rapide, moins cher et sans stress — pas d’attente au tapis, pas de frais de bagage. Un peu d’organisation suffit.', ar:'السفر بحقيبة يد فقط أسرع وأرخص وبلا توتّر — لا انتظار عند السير المتحرّك ولا رسوم أمتعة. وقليل من التخطيط يجعله سهلًا.'},
   secs:[
     {h:{en:'Know the size and liquid rules', fr:'Connaissez les règles de taille et de liquides', ar:'اعرف قواعد المقاس والسوائل'},
      p:{en:'Most airlines allow a cabin bag around 55 × 40 × 20 cm, but budget carriers are stricter and may charge for anything bigger than a small under-seat bag — always check your airline before you fly. Liquids must be in containers of 100 ml or less, inside one clear resealable bag.', fr:'La plupart des compagnies acceptent un bagage cabine d’environ 55 × 40 × 20 cm, mais les compagnies low-cost sont plus strictes et font payer tout ce qui dépasse un petit sac sous le siège — vérifiez toujours votre compagnie avant de partir. Les liquides doivent être en contenants de 100 ml maximum, dans un sac transparent refermable.', ar:'تسمح معظم الشركات بحقيبة مقصورة بنحو 55 × 40 × 20 سم، لكن شركات التوفير أكثر صرامة وقد تفرض رسومًا على أي شيء أكبر من حقيبة صغيرة تحت المقعد — تحقّق دائمًا من شركتك قبل السفر. ويجب أن تكون السوائل في عبوات سعة 100 مل أو أقل، داخل كيس شفّاف قابل لإعادة الإغلاق.'}},
     {h:{en:'Pack smart and light', fr:'Préparez malin et léger', ar:'احزم بذكاء وخفّة'},
      p:{en:'Roll clothes to save space, wear your bulkiest items (coat, boots) on the plane, and pack versatile pieces you can mix and match. Keep documents, chargers and any medication in an easy-to-reach pocket.', fr:'Roulez vos vêtements pour gagner de la place, portez vos articles les plus volumineux (manteau, bottes) dans l’avion et emportez des pièces polyvalentes à combiner. Gardez documents, chargeurs et médicaments dans une poche facile d’accès.', ar:'لُفّ الملابس لتوفير المساحة، وارتدِ أضخم القطع (المعطف، الحذاء) في الطائرة، واحزم قطعًا متعدّدة الاستعمال يمكن تنسيقها. واحتفظ بالوثائق والشواحن وأي دواء في جيب سهل الوصول.'}},
     {h:{en:'Dodge the baggage fees', fr:'Évitez les frais de bagage', ar:'تجنّب رسوم الأمتعة'},
      p:{en:'Checked-bag fees can quietly double a cheap fare. Going carry-on only keeps the price you saw the price you pay. If you do need a checked bag, add it online in advance — it’s almost always cheaper than at the airport.', fr:'Les frais de bagage en soute peuvent discrètement doubler un billet bon marché. Voyager en cabine uniquement garde le prix vu comme le prix payé. Si vous avez besoin d’une soute, ajoutez-la en ligne à l’avance — c’est presque toujours moins cher qu’à l’aéroport.', ar:'قد تضاعف رسوم الحقيبة المسجّلة سعرًا رخيصًا بهدوء. والسفر بحقيبة يد فقط يبقي السعر الذي رأيته هو السعر الذي تدفعه. وإن احتجت حقيبة مسجّلة، فأضفها عبر الإنترنت مسبقًا — فهي أرخص دائمًا تقريبًا من المطار.'}},
   ],
   cta:{href:'/flights/', label:{en:'Find a carry-on fare →', fr:'Trouver un tarif cabine →', ar:'ابحث عن سعر بحقيبة يد →'}, sub:{en:'Compare airlines, baggage included.', fr:'Comparez les compagnies, bagage compris.', ar:'قارن الشركات، مع الأمتعة.'}}},
];

const L = {
  en:{dir:'ltr',lang:'en',home:'/',dest:'/destinations/',blog:'/blog/',hotels:'/hotels',cars:'/cars',esim:'/esim',comp:'/compensation',
      nav:{flights:'Flights',hotels:'Hotels',cars:'Cars',esim:'eSIM',dest:'Destinations',blog:'Blog',comp:'Compensation'},
      hubTitle:'Travel Blog — Tips & Guides for Travellers from Morocco | OasisDeal',
      hubDesc:'Practical travel guides for travellers from Morocco: cheap flights, compensation rights, travel eSIMs, Umrah and more.',
      hubH:'Travel tips & guides', hubIntro:'Practical guides for travellers from Morocco — flights, rights, staying online, and getting more from every trip.',
      cats:{flights:'Flights',rights:'Your rights',esim:'eSIM',umrah:'Umrah',guide:'Guide'},
      readMore:'Read', back:'← All articles', published:'Published', by:'By the OasisDeal team',
      relatedH:'Keep exploring', secure:'Secure & free to use · No booking fees',
      mt:function(t){return t+' | OasisDeal';}},
  fr:{dir:'ltr',lang:'fr',home:'/fr/',dest:'/fr/destinations/',blog:'/fr/blog/',hotels:'/hotels',cars:'/cars',esim:'/esim',comp:'/compensation',
      nav:{flights:'Vols',hotels:'Hôtels',cars:'Voitures',esim:'eSIM',dest:'Destinations',blog:'Blog',comp:'Indemnisation'},
      hubTitle:'Blog voyage — Conseils & guides pour les voyageurs du Maroc | OasisDeal',
      hubDesc:'Guides pratiques pour les voyageurs du Maroc : vols pas chers, droits à indemnisation, eSIM voyage, Omra et plus.',
      hubH:'Conseils & guides voyage', hubIntro:'Guides pratiques pour les voyageurs du Maroc — vols, droits, rester connecté et profiter de chaque voyage.',
      cats:{flights:'Vols',rights:'Vos droits',esim:'eSIM',umrah:'Omra',guide:'Guide'},
      readMore:'Lire', back:'← Tous les articles', published:'Publié le', by:'Par l’équipe OasisDeal',
      relatedH:'Continuez à explorer', secure:'Sécurisé et gratuit · Sans frais',
      mt:function(t){return t+' | OasisDeal';}},
  ar:{dir:'rtl',lang:'ar',home:'/ar/',dest:'/ar/destinations/',blog:'/ar/blog/',hotels:'/hotels',cars:'/cars',esim:'/esim',comp:'/compensation',
      nav:{flights:'رحلات',hotels:'فنادق',cars:'سيارات',esim:'eSIM',dest:'الوجهات',blog:'المدوّنة',comp:'تعويضات'},
      hubTitle:'مدوّنة السفر — نصائح وأدلة للمسافرين من المغرب | OasisDeal',
      hubDesc:'أدلة سفر عملية للمسافرين من المغرب: رحلات رخيصة، حقوق التعويض، شرائح eSIM للسفر، العمرة والمزيد.',
      hubH:'نصائح وأدلة السفر', hubIntro:'أدلة عملية للمسافرين من المغرب — الرحلات، الحقوق، البقاء متصلًا، والاستفادة أكثر من كل رحلة.',
      cats:{flights:'رحلات',rights:'حقوقك',esim:'eSIM',umrah:'العمرة',guide:'دليل'},
      readMore:'اقرأ', back:'→ كل المقالات', published:'نُشر في', by:'فريق OasisDeal',
      relatedH:'واصل الاستكشاف', secure:'آمن ومجاني · دون رسوم حجز',
      mt:function(t){return t+' | OasisDeal';}},
};

function pre(lang){ return lang==='en'?'':'/'+lang; }
function homeName(lang){ return lang==='fr'?'Accueil':lang==='ar'?'الرئيسية':'Home'; }
function breadcrumb(items){ return {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':items.map(function(it,i){var o={'@type':'ListItem','position':i+1,'name':it.n}; if(it.u) o.item=it.u; return o;})}; }
const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#E8A33D"/><path d="M16 22c0-7 3-10 8-11-1 6-3 9-8 11z" fill="#241F5E"/><path d="M16 22c0-7-3-10-8-11 1 6 3 9 8 11z" fill="#4B3FCB"/><rect x="14.6" y="20" width="2.8" height="5" rx="1" fill="#241F5E"/></svg>';

function featureImg(a, lang){
  if(a.img){
    var exts=['webp','jpg','jpeg','png'];
    for(var i=0;i<exts.length;i++){
      var rel='images/destinations/'+a.img+'.'+exts[i];
      if(fs.existsSync(path.join(ROOT,rel))) return '<img class="dg-photo" src="/'+rel+'" alt="'+a.title[lang]+'" loading="lazy" decoding="async" width="1280" height="540" />';
    }
  }
  return '<svg class="dg-photo dg-svg" viewBox="0 0 1280 460" role="img" aria-label="'+a.title.en+'" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><linearGradient id="g'+a.slug.replace(/[^a-z]/g,'')+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4B3FCB"/><stop offset="1" stop-color="#241F5E"/></linearGradient></defs>'
    +'<rect width="1280" height="460" fill="url(#g'+a.slug.replace(/[^a-z]/g,'')+')"/>'
    +'<circle cx="1080" cy="110" r="60" fill="#E8A33D" opacity="0.9"/>'
    +'<g fill="#F4ECDD" opacity="0.14"><rect x="90" y="300" width="100" height="160"/><rect x="220" y="250" width="80" height="210"/><rect x="330" y="330" width="120" height="130"/><rect x="480" y="240" width="70" height="220"/><rect x="580" y="310" width="130" height="150"/><rect x="740" y="270" width="90" height="190"/><rect x="860" y="330" width="140" height="130"/><rect x="1030" y="290" width="110" height="170"/></g>'
    +'<text x="60" y="240" font-family="Fraunces, Georgia, serif" font-size="46" fill="#FFFBF5" font-weight="600" opacity="0.95">'+L.en.cats[a.cat]+'</text></svg>';
}

var NAVJS='<script>(function(){var C=\'.nav-div{display:inline-block;width:1px;height:18px;background:var(--line);margin:0 6px;vertical-align:middle;}.nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);cursor:pointer;}.nav-toggle span{display:block;width:20px;height:2px;background:var(--ink);border-radius:2px;transition:transform .2s,opacity .2s;}.nav-row.menu-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg);}.nav-row.menu-open .nav-toggle span:nth-child(2){opacity:0;}.nav-row.menu-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}@media(max-width:720px){.nav-div{display:none!important;}.nav-row{flex-wrap:nowrap!important;height:60px;position:relative;}.nav-toggle{display:flex;}.nav-links{position:absolute;top:100%;inset-inline-start:0;width:100%;flex-direction:column;align-items:stretch;gap:0!important;background:var(--paper);border:1px solid var(--line);border-radius:0 0 16px 16px;padding:8px;box-shadow:0 14px 30px rgba(24,26,46,.14);display:none!important;z-index:60;}.nav-row.menu-open .nav-links{display:flex!important;}.nav-links .nav-link{display:block!important;padding:13px 12px;font-size:1rem;border-bottom:1px solid var(--line);}.nav-links .btn{margin:10px 4px 4px;justify-content:center;}.nav-links .rp-langs{display:flex;justify-content:center;gap:16px;padding:12px;}.nav-links .rp-langs a{color:var(--ink);opacity:.75;}.nav-links .rp-langs a.on{opacity:1;}}\';function I(){var r=document.querySelector(".nav-row");if(!r||r.querySelector(".nav-toggle"))return;var l=r.querySelector(".nav-links");if(!l)return;var s=document.createElement("style");s.textContent=C;document.head.appendChild(s);var b=document.createElement("button");b.className="nav-toggle";b.type="button";b.setAttribute("aria-label","Menu");b.innerHTML="<span></span><span></span><span></span>";b.addEventListener("click",function(){r.classList.toggle("menu-open");});r.appendChild(b);l.addEventListener("click",function(e){if(e.target.closest("a"))r.classList.remove("menu-open");});}if(document.readyState!=="loading")I();else document.addEventListener("DOMContentLoaded",I);})();</script>';

function nav(lang, langsHtml){ var x=L[lang];
  return '<nav class="nav"><div class="container nav-row"><a class="logo" href="'+x.home+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a><div class="nav-links">'
    +'<a class="nav-link" href="'+x.home+'">'+x.nav.flights+'</a><a class="nav-link" href="'+x.hotels+'">'+x.nav.hotels+'</a><a class="nav-link" href="'+x.cars+'">'+x.nav.cars+'</a><a class="nav-link" href="'+x.esim+'">'+x.nav.esim+'</a><a class="nav-link" href="'+x.comp+'">'+x.nav.comp+'</a><span class="nav-div"></span><a class="nav-link" href="'+x.dest+'">'+x.nav.dest+'</a><a class="nav-link active" href="'+x.blog+'">'+x.nav.blog+'</a>'
    +(langsHtml?'<span class="rp-langs">'+langsHtml+'</span>':'')+'</div></div></nav>'; }
function footer(lang){ var x=L[lang]; return '<footer class="footer"><div class="container"><div class="footer-trust">🔒 '+x.secure+' · Travelpayouts · Stay22 · AirHelp</div><div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span></div></div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS; }

var EXTRA = '<style>'
  +'.rp-hero{background:linear-gradient(160deg,var(--majorelle) 0%,var(--majorelle-deep) 100%);color:#fff;padding:48px 0 44px}.rp-hero h1{color:#fff;font-size:clamp(1.8rem,4.4vw,2.9rem);line-height:1.12}.rp-hero .eyebrow{color:rgba(255,255,255,.85)}'
  +'.blog-meta{font-family:"IBM Plex Mono",monospace;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.8);margin-top:12px}'
  +'.dg-col{max-width:760px;margin:0 auto}'
  +'.dg-figure{margin:-26px 0 0}.dg-photo{display:block;width:100%;height:auto;max-height:420px;object-fit:cover;border-radius:18px;border:1px solid var(--line);box-shadow:0 20px 44px rgba(24,26,46,.12)}.dg-svg{aspect-ratio:1280/460}'
  +'.dg-article{font-size:1.04rem}.dg-article h2{font-size:1.4rem;margin:32px 0 10px}.dg-lead{font-size:1.15rem;line-height:1.7;color:var(--ink);margin-top:26px;font-weight:500}.dg-article p{line-height:1.75;color:var(--ink-soft);margin-bottom:6px}'
  +'.dg-todo{list-style:none;padding:0;margin:8px 0;display:grid;gap:10px;counter-reset:t}.dg-todo li{position:relative;padding:13px 16px 13px 48px;background:var(--paper);border:1px solid var(--line);border-radius:12px;color:var(--ink)}.dg-todo li::before{counter-increment:t;content:counter(t);position:absolute;inset-inline-start:14px;top:11px;width:22px;height:22px;border-radius:50%;background:var(--majorelle);color:#fff;font-size:.78rem;font-weight:700;display:flex;align-items:center;justify-content:center}'
  +'[dir=rtl] .dg-todo li{padding:13px 48px 13px 16px}'
  +'.blog-cta{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:22px;margin:30px 0;display:flex;flex-wrap:wrap;align-items:center;gap:14px;justify-content:space-between}.blog-cta p{margin:0;color:var(--ink-soft)}.blog-cta strong{color:var(--ink);font-size:1.05rem}'
  +'.nav .rp-langs a{margin-inline-start:8px;color:var(--ink-soft);text-decoration:none;font-size:.85rem}.nav .rp-langs a.on{color:var(--ink);font-weight:700;text-decoration:underline}'
  +'.blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-top:20px}'
  +'.blog-card{display:block;background:var(--paper);border:1px solid var(--line);border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;transition:border-color .15s,transform .15s}.blog-card:hover{border-color:var(--majorelle);transform:translateY(-2px)}'
  +'.blog-card .bc-img{width:100%;height:160px;object-fit:cover;display:block}.blog-card .bc-body{padding:16px}.blog-card .bc-cat{font-family:"IBM Plex Mono",monospace;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:var(--clay-deep);font-weight:600}.blog-card h2{font-size:1.12rem;margin:8px 0 6px;line-height:1.3}.blog-card p{color:var(--ink-soft);font-size:.9rem;line-height:1.5;margin:0}'
  +'</style>';

function head(lang, title, desc, canon, alts, ld){
  return '<!DOCTYPE html>\n<html lang="'+L[lang].lang+'" dir="'+L[lang].dir+'">\n<head>\n<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    +'<title>'+title+'</title>\n<meta name="description" content="'+desc+'" />\n<link rel="canonical" href="'+canon+'" />\n'+alts+'\n'
    +'<meta property="og:title" content="'+title+'" /><meta property="og:description" content="'+desc+'" /><meta property="og:url" content="'+canon+'" /><meta property="og:type" content="article" />\n'
    +'<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    +'<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/assets/site.css" />\n'+EXTRA
    +(ld?'\n<script type="application/ld+json">'+JSON.stringify(ld)+'</script>':'')+'\n</head>\n<body>\n';
}
function altsFor(p){ return ['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+p+'" />';}).join('\n')+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com'+p+'" />'; }
function langSwitch(lang, p){ return ['en','fr','ar'].map(function(lg){return '<a class="'+(lg===lang?'on':'')+'" href="'+(lg==='en'?'':'/'+lg)+p+'">'+lg.toUpperCase()+'</a>';}).join(''); }

function bodyHtml(a, lang){
  var html='<p class="dg-lead">'+a.lead[lang]+'</p>';
  if(a.secs) a.secs.forEach(function(s){ html+='<h2>'+s.h[lang]+'</h2><p>'+s.p[lang]+'</p>'; });
  if(a.tips){ html+='<h2>'+a.tipsH[lang]+'</h2><ol class="dg-todo">'+a.tips[lang].map(function(t){return '<li>'+t+'</li>';}).join('')+'</ol>'; }
  var c=a.cta, href=(c.href.charAt(0)==='/'&&!/^\/(hotels|esim|compensation)(\/|$)/.test(c.href)? pre(lang):'')+c.href;
  html+='<div class="blog-cta"><div><strong>'+c.sub[lang]+'</strong></div><a class="btn btn-primary" href="'+href+'">'+c.label[lang]+'</a></div>';
  return html;
}

function articlePage(a, lang){
  var x=L[lang], p='/blog/'+a.slug, url='https://oasisdeal.com'+pre(lang)+p;
  var ld={'@context':'https://schema.org','@type':'BlogPosting','headline':a.title[lang],'description':a.desc[lang],'datePublished':a.date,'dateModified':a.date,'inLanguage':lang,'author':{'@type':'Organization','name':'OasisDeal'},'publisher':{'@type':'Organization','name':'OasisDeal','logo':{'@type':'ImageObject','url':'https://oasisdeal.com/favicon.svg'}},'mainEntityOfPage':url};
  // related: up to 3 other articles
  var rel=ART.filter(function(o){return o.slug!==a.slug;}).sort(function(x,z){return (x.img?0:1)-(z.img?0:1);}).slice(0,3);
  var related='<div class="blog-grid">'+rel.map(function(o){return blogCard(o,lang);}).join('')+'</div>';
  var crumb=breadcrumb([{n:homeName(lang),u:'https://oasisdeal.com'+x.home},{n:x.nav.blog,u:'https://oasisdeal.com'+x.blog},{n:a.title[lang],u:url}]);
  return head(lang, x.mt(a.title[lang]), a.desc[lang], url, altsFor(p), [ld, crumb])
    + nav(lang, langSwitch(lang,p))
    + '<header class="rp-hero"><div class="container"><div class="dg-col">'
    + '<div class="eyebrow">'+x.cats[a.cat]+'</div>'
    + '<h1>'+a.title[lang]+'</h1>'
    + '<div class="blog-meta">'+x.published+' '+a.date+' · '+x.by+'</div>'
    + '</div></div></header>'
    + '<main class="container" style="padding-top:0;padding-bottom:40px"><div class="dg-col">'
    + '<figure class="dg-figure">'+featureImg(a,lang)+'</figure>'
    + '<article class="dg-article">'+bodyHtml(a,lang)
    + '<p style="margin-top:18px"><a href="'+x.blog+'" style="color:var(--majorelle);font-weight:600;text-decoration:none">'+x.back+'</a></p>'
    + '<h2>'+x.relatedH+'</h2>'+related
    + '</article></div></main>'
    + footer(lang)+'\n</body>\n</html>\n';
}

function blogCard(a, lang){
  var x=L[lang], href=pre(lang)+'/blog/'+a.slug;
  return '<a class="blog-card" href="'+href+'">'+featureImgCard(a,lang)
    +'<div class="bc-body"><div class="bc-cat">'+x.cats[a.cat]+'</div><h2>'+a.title[lang]+'</h2><p>'+a.desc[lang]+'</p></div></a>';
}
function featureImgCard(a, lang){
  if(a.img){ var exts=['webp','jpg','jpeg','png']; for(var i=0;i<exts.length;i++){ var rel='images/destinations/'+a.img+'.'+exts[i]; if(fs.existsSync(path.join(ROOT,rel))) return '<img class="bc-img" src="/'+rel+'" alt="'+a.title[lang]+'" loading="lazy" width="280" height="160" />'; } }
  return '<div class="bc-img" style="background:linear-gradient(160deg,var(--majorelle),var(--majorelle-deep));display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-family:\'Fraunces\',serif;font-size:1.3rem;opacity:.9">'+L.en.cats[a.cat]+'</span></div>';
}

function hubPage(lang){
  var x=L[lang], p='/blog/';
  var cards=ART.slice().sort(function(a,b){return (a.img?0:1)-(b.img?0:1);}).map(function(a){return blogCard(a,lang);}).join('');
  var crumb=breadcrumb([{n:homeName(lang),u:'https://oasisdeal.com'+x.home},{n:x.nav.blog,u:'https://oasisdeal.com'+x.blog}]);
  return head(lang, x.hubTitle, x.hubDesc, 'https://oasisdeal.com'+pre(lang)+p, altsFor(p), crumb)
    + nav(lang, langSwitch(lang,p))
    + '<header class="rp-hero"><div class="container"><h1>'+x.hubH+'</h1><p style="opacity:.92;max-width:640px;margin-top:10px;font-size:1.05rem">'+x.hubIntro+'</p></div></header>'
    + '<main class="container" style="padding-top:24px;padding-bottom:44px"><div class="blog-grid">'+cards+'</div></main>'
    + footer(lang)+'\n</body>\n</html>\n';
}

function ensure(p){fs.mkdirSync(p,{recursive:true});}
function write(rel,html){var ff=path.join(ROOT,rel);ensure(path.dirname(ff));fs.writeFileSync(ff,html);}

var count=0;
['en','fr','ar'].forEach(function(lang){
  var base=lang==='en'?'blog':path.join(lang,'blog');
  ART.forEach(function(a){ write(path.join(base,a.slug+'.html'), articlePage(a,lang)); count++; });
  write(path.join(base,'index.html'), hubPage(lang));
});
console.log('wrote', count, 'blog articles +', 3, 'hubs');

// merge blog URLs into sitemap.xml (idempotent) + write .blog-urls.json
var blogUrls=[];
['','/fr','/ar'].forEach(function(pre){
  blogUrls.push('https://oasisdeal.com'+pre+'/blog/');
  ART.forEach(function(a){ blogUrls.push('https://oasisdeal.com'+pre+'/blog/'+a.slug); });
});
var smPath=path.join(ROOT,'sitemap.xml');
if(fs.existsSync(smPath)){
  var sm=fs.readFileSync(smPath,'utf8');
  blogUrls.forEach(function(u){ if(sm.indexOf('<loc>'+u+'</loc>')===-1){ sm=sm.replace('</urlset>','  <url><loc>'+u+'</loc></url>\n</urlset>'); } });
  fs.writeFileSync(smPath,sm);
  console.log('merged', blogUrls.length, 'blog urls into sitemap.xml');
}
fs.writeFileSync(path.join(ROOT,'.blog-urls.json'), JSON.stringify(blogUrls));

/* ---- full multi-column footer (shared, appended to each generator) ---- */
function fullFooter(lang){
  var P=lang==='en'?'':'/'+lang, H=lang==='en'?'/':'/'+lang+'/';
  var T={en:{ex:'Explore',co:'Company',pr:'Popular routes',gu:'Guides',tag:'Find your savings oasis — flights, hotels and compensation, compared honestly.',flights:'Flights',hotels:'Hotels',cars:'Cars',esim:'eSIM',comp:'Compensation',dest:'Destinations',blog:'Blog',about:'About',contact:'Contact',privacy:'Privacy',rights:'Flight delay rights',umrah:'Cheapest Umrah airport',vs:'Casablanca vs Tangier',allr:'All routes →',secure:'Secure & free to use · No booking fees',r:[['casablanca-paris','Casablanca → Paris'],['casablanca-madrid','Casablanca → Madrid'],['tangier-madrid','Tangier → Madrid']]},
    fr:{ex:'Explorer',co:'Société',pr:'Lignes populaires',gu:'Guides',tag:'Trouvez votre oasis d’économies — vols, hôtels et indemnisation, comparés honnêtement.',flights:'Vols',hotels:'Hôtels',cars:'Voitures',esim:'eSIM',comp:'Indemnisation',dest:'Destinations',blog:'Blog',about:'À propos',contact:'Contact',privacy:'Confidentialité',rights:'Indemnisation de vol',umrah:'Aéroport le moins cher pour la Omra',vs:'Casablanca ou Tanger',allr:'Toutes les lignes →',secure:'Sécurisé et gratuit · Sans frais',r:[['casablanca-paris','Casablanca → Paris'],['casablanca-madrid','Casablanca → Madrid'],['tangier-madrid','Tanger → Madrid']]},
    ar:{ex:'استكشف',co:'الشركة',pr:'رحلات شائعة',gu:'أدلة',tag:'اعثر على واحة التوفير — رحلات وفنادق وتعويضات، نقارنها بصدق.',flights:'رحلات',hotels:'فنادق',cars:'سيارات',esim:'eSIM',comp:'تعويضات',dest:'الوجهات',blog:'المدوّنة',about:'من نحن',contact:'اتصل بنا',privacy:'الخصوصية',rights:'تعويض تأخّر الرحلة',umrah:'أرخص مطار للعمرة',vs:'الدار البيضاء أم طنجة',allr:'كل الوجهات →',secure:'آمن ومجاني · دون رسوم حجز',r:[['casablanca-paris','الدار البيضاء ← باريس'],['casablanca-madrid','الدار البيضاء ← مدريد'],['tangier-madrid','طنجة ← مدريد']]}}[lang];
  function col(h,links){return '<div class="footer-col"><h4>'+h+'</h4>'+links.map(function(l){return '<a href="'+l[0]+'">'+l[1]+'</a>';}).join('')+'</div>';}
  var explore=col(T.ex,[[H,T.flights],['/hotels',T.hotels],['/esim',T.esim],['/compensation',T.comp],[P+'/destinations/',T.dest],[P+'/blog/',T.blog]]);
  var company=col(T.co,[['/about',T.about],['/contact',T.contact],['/privacy',T.privacy]]);
  var routes=col(T.pr,T.r.map(function(z){return [P+'/flights/'+z[0],z[1]];}).concat([[P+'/flights/',T.allr]]));
  var guides=col(T.gu,[[P+'/flight-rights',T.rights],[P+'/airports/cheapest-airport-umrah-morocco',T.umrah],[P+'/airports/casablanca-vs-tangier-flights-europe',T.vs]]);
  return '<footer class="footer"><div class="container">'
    +'<div class="footer-top"><div class="footer-brand"><a class="logo footer-logo" href="'+H+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a><p class="footer-tag">'+T.tag+'</p></div>'
    +'<div class="footer-cols">'+explore+routes+guides+company+'</div></div>'
    +'<div class="footer-trust">🔒 '+T.secure+' · Travelpayouts · Stay22 · AirHelp</div>'
    +'<div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span></div>'
    +'</div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS;
}
function footer(lang){return fullFooter(lang);}

