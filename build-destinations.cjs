/* OasisDeal destinations / travel-BLOG generator.
   "Explore the world" hub + one blog-style guide per destination (EN/FR/AR,
   separate URLs + hreflang). Each guide: feature image (real photo at
   images/destinations/<slug>.(webp|jpg) if present, else a branded SVG
   banner), an article (lead + top things to do + getting there from
   Morocco), live "cheapest from Casablanca" fare, facts, cross-links and
   FAQ. Run: node build-destinations.cjs */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const STAY22 = "<script>(function(s,t,a,y,o,n){s.Stay22=s.Stay22||{};s.Stay22.params={lmaID:'6a444061c151746f75b1b4ff'};o=t.createElement(a);n=t.getElementsByTagName(a)[0];o.async=1;o.src=y;n.parentNode.insertBefore(o,n);})(window,document,'script','https://scripts.stay22.com/letmeallez.js');</script>";

const CMN_ROUTE = {PAR:1,LON:1,MAD:1,AMS:1,IST:1,DXB:1,JED:1,BRU:1,MIL:1,LYS:1,DUS:1,FRA:1};

// region keys: eu / me / as / af
const DEST = [
  {code:'IST', slug:'istanbul', region:'eu', trend:1, flag:'🇹🇷', cur:'TRY', rslug:'casablanca-istanbul',
    lang_en:'Turkish', lang_fr:'Turc', lang_ar:'التركية', ar_name:'إسطنبول', fr_name:'Istanbul',
    bt_en:'Apr–May & Sep–Oct', bt_fr:'avr.–mai & sep.–oct.', bt_ar:'أبريل–مايو وسبتمبر–أكتوبر',
    en:'Where Europe meets Asia — grand bazaars, Bosphorus cruises and Ottoman palaces.', fr:'Là où l’Europe rencontre l’Asie — grands bazars, croisières sur le Bosphore et palais ottomans.', ar:'حيث تلتقي أوروبا بآسيا — أسواق كبرى، رحلات في مضيق البوسفور، وقصور عثمانية.',
    lead_en:'Istanbul is the only city straddling two continents, blending Byzantine and Ottoman grandeur with a buzzing food and arts scene. From the call to prayer over the rooftops to a ferry gliding up the Bosphorus, it rewards every kind of traveller.', lead_fr:'Istanbul est la seule ville à cheval sur deux continents, mêlant grandeur byzantine et ottomane à une scène gastronomique et artistique trépidante. De l’appel à la prière sur les toits au ferry qui remonte le Bosphore, elle séduit tous les voyageurs.', lead_ar:'إسطنبول هي المدينة الوحيدة الممتدة على قارتين، تمزج العظمة البيزنطية والعثمانية بمشهد نابض من الطعام والفنون. من الأذان فوق السطوح إلى عبّارة تشقّ مضيق البوسفور، تأسر كل مسافر.',
    todo_en:['Tour Hagia Sophia & the Blue Mosque','Haggle in the Grand Bazaar','Cruise the Bosphorus at sunset','Eat your way through Kadıköy'], todo_fr:['Visiter Sainte-Sophie et la Mosquée Bleue','Marchander au Grand Bazar','Croisière sur le Bosphore au coucher du soleil','Découvrir la gastronomie de Kadıköy'], todo_ar:['زيارة آيا صوفيا والجامع الأزرق','المساومة في البازار الكبير','جولة بحرية في البوسفور عند الغروب','تذوّق أطعمة حي قاضي كوي']},
  {code:'BCN', slug:'barcelona', region:'eu', trend:1, flag:'🇪🇸', cur:'EUR', rslug:'',
    lang_en:'Spanish', lang_fr:'Espagnol', lang_ar:'الإسبانية', ar_name:'برشلونة', fr_name:'Barcelone',
    bt_en:'May–Jun & Sep', bt_fr:'mai–juin & sep.', bt_ar:'مايو–يونيو وسبتمبر',
    en:'Gaudí’s architecture, Mediterranean beaches and lively tapas nights.', fr:'L’architecture de Gaudí, les plages méditerranéennes et les soirées tapas animées.', ar:'عمارة غاودي، شواطئ البحر المتوسط، وأمسيات التاباس النابضة.',
    lead_en:'Barcelona pairs Gaudí’s dreamlike architecture with Mediterranean beaches and one of Europe’s best food cultures. Compact, walkable and sunny most of the year, it’s an easy weekend escape.', lead_fr:'Barcelone associe l’architecture onirique de Gaudí aux plages méditerranéennes et à l’une des meilleures cultures gastronomiques d’Europe. Compacte, agréable à pied et ensoleillée presque toute l’année, c’est une escapade de week-end idéale.', lead_ar:'تجمع برشلونة بين عمارة غاودي الحالمة وشواطئ البحر المتوسط وواحدة من أفضل ثقافات الطعام في أوروبا. مدينة مدمجة، يسهل التجول فيها سيرًا، ومشمسة معظم العام — وجهة مثالية لعطلة نهاية أسبوع.',
    todo_en:['Marvel at the Sagrada Família','Wander Park Güell & the Gothic Quarter','Relax on Barceloneta beach','Graze on tapas in El Born'], todo_fr:['Admirer la Sagrada Família','Flâner au parc Güell et dans le Gothique','Se détendre à la plage de Barceloneta','Déguster des tapas à El Born'], todo_ar:['التعجّب من ساغرادا فاميليا','التجوّل في بارك غويل والحي القوطي','الاسترخاء على شاطئ برشلونيتا','تذوّق التاباس في حي البورن']},
  {code:'PAR', slug:'paris', region:'eu', trend:0, flag:'🇫🇷', cur:'EUR', rslug:'casablanca-paris',
    lang_en:'French', lang_fr:'Français', lang_ar:'الفرنسية', ar_name:'باريس', fr_name:'Paris',
    bt_en:'Apr–Jun & Sep–Oct', bt_fr:'avr.–juin & sep.–oct.', bt_ar:'أبريل–يونيو وسبتمبر–أكتوبر',
    en:'The City of Light — the Louvre, café terraces and the Eiffel Tower.', fr:'La Ville Lumière — le Louvre, les terrasses de café et la tour Eiffel.', ar:'مدينة النور — متحف اللوفر، مقاهي الأرصفة، وبرج إيفل.',
    lead_en:'Paris needs little introduction — but beyond the Eiffel Tower and the Louvre, it’s a city of neighbourhood cafés, riverside walks and world-class pastry. Spring and early autumn bring the softest light and the smallest queues.', lead_fr:'Paris n’a plus besoin de présentation — mais au-delà de la tour Eiffel et du Louvre, c’est une ville de cafés de quartier, de balades au bord de la Seine et de pâtisseries d’exception. Le printemps et le début de l’automne offrent la plus belle lumière et moins de files.', lead_ar:'باريس غنية عن التعريف — لكنها وراء برج إيفل واللوفر مدينة مقاهٍ حيّة، ونزهات على ضفاف النهر، وحلويات عالمية. الربيع وبداية الخريف يمنحان أجمل ضوء وأقصر الطوابير.',
    todo_en:['See the Louvre & Musée d’Orsay','Photograph the Eiffel Tower','Stroll Montmartre & the Seine','Day-trip to Versailles'], todo_fr:['Voir le Louvre et le musée d’Orsay','Photographier la tour Eiffel','Flâner à Montmartre et le long de la Seine','Excursion à Versailles'], todo_ar:['زيارة اللوفر ومتحف أورسيه','تصوير برج إيفل','التنزّه في مونمارتر وعلى ضفاف السين','رحلة يومية إلى قصر فرساي']},
  {code:'MAD', slug:'madrid', region:'eu', trend:0, flag:'🇪🇸', cur:'EUR', rslug:'casablanca-madrid',
    lang_en:'Spanish', lang_fr:'Espagnol', lang_ar:'الإسبانية', ar_name:'مدريد', fr_name:'Madrid',
    bt_en:'Mar–May & Sep–Nov', bt_fr:'mars–mai & sep.–nov.', bt_ar:'مارس–مايو وسبتمبر–نوفمبر',
    en:'World-class museums, grand plazas and Spain’s best nightlife.', fr:'Des musées de renommée mondiale, de grandes places et la meilleure vie nocturne d’Espagne.', ar:'متاحف عالمية، ساحات كبرى، وأفضل حياة ليلية في إسبانيا.',
    lead_en:'Spain’s capital is grand boulevards, golden-age art and a nightlife that runs till dawn. Drier and higher than the coast, Madrid is at its best in spring and autumn.', lead_fr:'La capitale espagnole, ce sont de grands boulevards, l’art du Siècle d’or et une vie nocturne qui dure jusqu’à l’aube. Plus sèche et en altitude, Madrid se savoure au printemps et en automne.', lead_ar:'عاصمة إسبانيا جادّات كبرى، وفنون العصر الذهبي، وحياة ليلية تمتدّ حتى الفجر. وهي أكثر جفافًا وارتفاعًا من الساحل، فتتألّق في الربيع والخريف.',
    todo_en:['Tour the Prado & Reina Sofía','Relax in Retiro Park','Catch a flamenco show','Feast at Mercado de San Miguel'], todo_fr:['Visiter le Prado et le Reina Sofía','Se détendre au parc du Retiro','Assister à un spectacle de flamenco','Se régaler au Mercado de San Miguel'], todo_ar:['زيارة متحفي برادو وريّنا صوفيا','الاسترخاء في حديقة الريتيرو','حضور عرض فلامنكو','تذوّق الطعام في سوق سان ميغيل']},
  {code:'AMS', slug:'amsterdam', region:'eu', trend:0, flag:'🇳🇱', cur:'EUR', rslug:'casablanca-amsterdam',
    lang_en:'Dutch', lang_fr:'Néerlandais', lang_ar:'الهولندية', ar_name:'أمستردام', fr_name:'Amsterdam',
    bt_en:'Apr–May & Sep', bt_fr:'avr.–mai & sep.', bt_ar:'أبريل–مايو وسبتمبر',
    en:'Picturesque canals, world museums and bike-friendly streets.', fr:'Des canaux pittoresques, de grands musées et des rues adaptées au vélo.', ar:'قنوات مائية خلابة، متاحف عالمية، وشوارع صديقة للدراجات.',
    lead_en:'Amsterdam is canals, gabled houses and a bike-first way of life, with world-class museums packed into a walkable centre. Visit in late spring for tulips and long, bright evenings.', lead_fr:'Amsterdam, ce sont des canaux, des maisons à pignons et un mode de vie à vélo, avec de grands musées concentrés dans un centre piéton. Venez à la fin du printemps pour les tulipes et les longues soirées claires.', lead_ar:'أمستردام قنوات وبيوت بواجهات مدبّبة وأسلوب حياة يعتمد الدرّاجات، مع متاحف عالمية في مركز يسهل التجول فيه. زرها أواخر الربيع لرؤية التوليب والأمسيات الطويلة المضيئة.',
    todo_en:['See the Van Gogh & Rijksmuseum','Cruise the canal ring','Rent a bike like a local','Visit the Anne Frank House'], todo_fr:['Voir le Van Gogh et le Rijksmuseum','Croisière sur les canaux','Louer un vélo comme un local','Visiter la maison d’Anne Frank'], todo_ar:['زيارة متحف فان غوخ والرايكس','جولة بالقارب في القنوات','استئجار درّاجة كالسكان المحليين','زيارة بيت آن فرانك']},
  {code:'ROM', slug:'rome', region:'eu', trend:0, flag:'🇮🇹', cur:'EUR', rslug:'',
    lang_en:'Italian', lang_fr:'Italien', lang_ar:'الإيطالية', ar_name:'روما', fr_name:'Rome',
    bt_en:'Apr–Jun & Sep–Oct', bt_fr:'avr.–juin & sep.–oct.', bt_ar:'أبريل–يونيو وسبتمبر–أكتوبر',
    en:'The Colosseum, the Vatican and unforgettable Italian food.', fr:'Le Colisée, le Vatican et une cuisine italienne inoubliable.', ar:'الكولوسيوم، الفاتيكان، وطعام إيطالي لا يُنسى.',
    lead_en:'Rome is an open-air museum where ancient ruins, Renaissance art and perfect pasta sit side by side. Spring and autumn dodge the summer heat and the biggest crowds.', lead_fr:'Rome est un musée à ciel ouvert où ruines antiques, art de la Renaissance et pâtes parfaites se côtoient. Le printemps et l’automne évitent la chaleur estivale et les grandes foules.', lead_ar:'روما متحف في الهواء الطلق تتجاور فيه الآثار القديمة وفنون النهضة والمعكرونة المثالية. الربيع والخريف يتفاديان حرّ الصيف وأكبر الزحام.',
    todo_en:['Explore the Colosseum & Forum','Visit the Vatican & Sistine Chapel','Toss a coin in the Trevi Fountain','Eat carbonara in Trastevere'], todo_fr:['Explorer le Colisée et le Forum','Visiter le Vatican et la chapelle Sixtine','Jeter une pièce dans la fontaine de Trevi','Manger des carbonara au Trastevere'], todo_ar:['استكشاف الكولوسيوم والمنتدى','زيارة الفاتيكان وكنيسة سيستينا','رمي عملة في نافورة تريفي','تناول الكاربونارا في تراستيفيري']},
  {code:'LON', slug:'london', region:'eu', trend:0, flag:'🇬🇧', cur:'GBP', rslug:'casablanca-london',
    lang_en:'English', lang_fr:'Anglais', lang_ar:'الإنجليزية', ar_name:'لندن', fr_name:'Londres',
    bt_en:'May–Sep', bt_fr:'mai–sep.', bt_ar:'مايو–سبتمبر',
    en:'Iconic landmarks, free museums and endless things to do.', fr:'Des monuments emblématiques, des musées gratuits et mille choses à faire.', ar:'معالم شهيرة، متاحف مجانية، وأنشطة لا تنتهي.',
    lead_en:'London packs centuries of history, free world-class museums and a famously diverse food scene into one sprawling, walkable capital. Long summer days are the liveliest time to visit.', lead_fr:'Londres concentre des siècles d’histoire, de grands musées gratuits et une scène culinaire réputée pour sa diversité dans une capitale tentaculaire et accessible à pied. Les longues journées d’été sont la période la plus animée.', lead_ar:'تجمع لندن قرونًا من التاريخ، ومتاحف عالمية مجانية، ومشهد طعام شهير بتنوّعه، في عاصمة شاسعة يسهل التجوّل فيها. أيام الصيف الطويلة هي أكثر الأوقات حيوية.',
    todo_en:['See the British Museum (free)','Walk Westminster & the South Bank','Explore Camden & Borough markets','Catch a West End show'], todo_fr:['Voir le British Museum (gratuit)','Marcher à Westminster et South Bank','Explorer les marchés de Camden et Borough','Voir un spectacle dans le West End'], todo_ar:['زيارة المتحف البريطاني (مجانًا)','التجوّل في وستمنستر وضفّة التايمز الجنوبية','استكشاف أسواق كامدن وبورو','حضور عرض في ويست إند']},
  {code:'DXB', slug:'dubai', region:'me', trend:1, flag:'🇦🇪', cur:'AED', rslug:'casablanca-dubai',
    lang_en:'Arabic', lang_fr:'Arabe', lang_ar:'العربية', ar_name:'دبي', fr_name:'Dubaï',
    bt_en:'Nov–Mar', bt_fr:'nov.–mars', bt_ar:'نوفمبر–مارس',
    en:'Futuristic skylines, desert safaris and world-class shopping.', fr:'Des gratte-ciels futuristes, des safaris dans le désert et du shopping de classe mondiale.', ar:'ناطحات سحاب مستقبلية، رحلات سفاري صحراوية، وتسوق عالمي.',
    lead_en:'Dubai turns the desert into spectacle — record-breaking towers, gold souks and dune adventures, all wrapped in year-round sunshine. The cooler November-to-March window is the sweet spot.', lead_fr:'Dubaï transforme le désert en spectacle — tours record, souks de l’or et aventures dans les dunes, le tout sous un soleil permanent. La fenêtre plus fraîche de novembre à mars est idéale.', lead_ar:'تحوّل دبي الصحراء إلى مشهد مبهر — أبراج قياسية، وأسواق ذهب، ومغامرات في الكثبان، تحت شمس طوال العام. وأفضل وقت هو الفترة الأبرد من نوفمبر إلى مارس.',
    todo_en:['Go up the Burj Khalifa','Desert safari & dune bashing','Wander the Gold & Spice souks','Beach day at Jumeirah'], todo_fr:['Monter au Burj Khalifa','Safari dans le désert et dunes','Parcourir les souks de l’or et des épices','Journée plage à Jumeirah'], todo_ar:['الصعود إلى برج خليفة','سفاري صحراوي وتطعيس الكثبان','التجوّل في سوقي الذهب والتوابل','يوم على شاطئ جميرا']},
  {code:'JED', slug:'jeddah', region:'me', trend:0, flag:'🇸🇦', cur:'SAR', rslug:'casablanca-jeddah',
    lang_en:'Arabic', lang_fr:'Arabe', lang_ar:'العربية', ar_name:'جدة', fr_name:'Djeddah',
    bt_en:'Nov–Mar', bt_fr:'nov.–mars', bt_ar:'نوفمبر–مارس',
    en:'Gateway to Umrah and the Red Sea, with the charming old town of Al-Balad.', fr:'Porte de la Omra et de la mer Rouge, avec la charmante vieille ville d’Al-Balad.', ar:'بوابة العمرة والبحر الأحمر، مع بلدة البلد القديمة الساحرة.',
    lead_en:'Jeddah is Saudi Arabia’s Red Sea gateway and the traditional arrival point for Umrah, with the UNESCO-listed coral-stone old town of Al-Balad and a long, breezy seaside corniche.', lead_fr:'Djeddah est la porte de l’Arabie saoudite sur la mer Rouge et le point d’arrivée traditionnel pour la Omra, avec la vieille ville d’Al-Balad (UNESCO) en pierre de corail et une longue corniche en bord de mer.', lead_ar:'جدة بوابة السعودية على البحر الأحمر ونقطة الوصول التقليدية لأداء العمرة، وفيها حي البلد التاريخي المدرَج في اليونسكو بمبانيه المرجانية، وكورنيش بحري طويل.',
    todo_en:['Explore historic Al-Balad','Walk the Jeddah Corniche','Snorkel the Red Sea reefs','Use it as your Umrah gateway'], todo_fr:['Explorer le quartier historique d’Al-Balad','Se promener sur la corniche de Djeddah','Faire du snorkeling dans la mer Rouge','En faire votre porte d’entrée pour la Omra'], todo_ar:['استكشاف حي البلد التاريخي','التنزّه على كورنيش جدة','الغطس في شعاب البحر الأحمر','اتخاذها بوابةً لأداء العمرة']},
  {code:'BKK', slug:'bangkok', region:'as', trend:1, flag:'🇹🇭', cur:'THB', rslug:'',
    lang_en:'Thai', lang_fr:'Thaï', lang_ar:'التايلاندية', ar_name:'بانكوك', fr_name:'Bangkok',
    bt_en:'Nov–Feb', bt_fr:'nov.–fév.', bt_ar:'نوفمبر–فبراير',
    en:'Glittering temples, legendary street food and buzzing night markets.', fr:'Des temples scintillants, une street-food légendaire et des marchés nocturnes animés.', ar:'معابد متلألئة، مأكولات شارع أسطورية، وأسواق ليلية نابضة.',
    lead_en:'Bangkok is a sensory rush of golden temples, floating markets and some of the world’s best street food, at prices that stretch a Moroccan budget far. The cool, dry season (Nov–Feb) is the most comfortable.', lead_fr:'Bangkok est un tourbillon sensoriel de temples dorés, de marchés flottants et de l’une des meilleures street-foods du monde, à des prix qui font durer un budget marocain. La saison fraîche et sèche (nov.–fév.) est la plus agréable.', lead_ar:'بانكوك دفقة من المتعة الحسّية: معابد ذهبية، وأسواق عائمة، وبعض أفضل أطعمة الشارع في العالم بأسعار تكفي ميزانية مغربية لوقت طويل. والموسم البارد الجاف (نوفمبر–فبراير) هو الأكثر راحة.',
    todo_en:['See the Grand Palace & Wat Pho','Street-food crawl in Chinatown','Long-tail boat the canals','Shop Chatuchak weekend market'], todo_fr:['Voir le Grand Palais et le Wat Pho','Tournée street-food à Chinatown','Balade en bateau sur les canaux','Faire les boutiques du marché de Chatuchak'], todo_ar:['زيارة القصر الكبير ومعبد وات بو','جولة طعام شارع في الحي الصيني','جولة بالقوارب في القنوات','التسوّق في سوق تشاتوتشاك']},
  {code:'KUL', slug:'kuala-lumpur', region:'as', trend:1, flag:'🇲🇾', cur:'MYR', rslug:'',
    lang_en:'Malay', lang_fr:'Malais', lang_ar:'الماليزية', ar_name:'كوالالمبور', fr_name:'Kuala Lumpur',
    bt_en:'Dec–Feb', bt_fr:'déc.–fév.', bt_ar:'ديسمبر–فبراير',
    en:'The Petronas Towers, rainforest parks and incredible food courts.', fr:'Les tours Petronas, des parcs de forêt tropicale et une cuisine incroyable.', ar:'برجا بتروناس، حدائق الغابات المطيرة، وأطعمة مذهلة.',
    lead_en:'Kuala Lumpur mixes gleaming towers with rainforest, mosques and a food culture blending Malay, Chinese and Indian flavours — and it’s one of Asia’s most affordable big cities.', lead_fr:'Kuala Lumpur mêle tours étincelantes, forêt tropicale, mosquées et une cuisine alliant saveurs malaises, chinoises et indiennes — et c’est l’une des grandes villes les plus abordables d’Asie.', lead_ar:'تمزج كوالالمبور بين الأبراج اللامعة والغابات المطيرة والمساجد وثقافة طعام تجمع نكهات الملايو والصين والهند — وهي من أرخص المدن الكبرى في آسيا.',
    todo_en:['Visit the Petronas Twin Towers','Climb the Batu Caves','Eat at Jalan Alor night market','Day-trip to the highlands'], todo_fr:['Visiter les tours jumelles Petronas','Gravir les grottes de Batu','Manger au marché de nuit de Jalan Alor','Excursion vers les hautes terres'], todo_ar:['زيارة برجي بتروناس التوأم','صعود كهوف باتو','تناول الطعام في سوق جالان ألور الليلي','رحلة يومية إلى المرتفعات']},
  {code:'CAI', slug:'cairo', region:'af', trend:1, flag:'🇪🇬', cur:'EGP', rslug:'',
    lang_en:'Arabic', lang_fr:'Arabe', lang_ar:'العربية', ar_name:'القاهرة', fr_name:'Le Caire',
    bt_en:'Oct–Apr', bt_fr:'oct.–avr.', bt_ar:'أكتوبر–أبريل',
    en:'The Pyramids of Giza, the Nile and thousands of years of history.', fr:'Les pyramides de Gizeh, le Nil et des milliers d’années d’histoire.', ar:'أهرامات الجيزة، نهر النيل، وآلاف السنين من التاريخ.',
    lead_en:'Cairo is the gateway to ancient Egypt — the Pyramids of Giza and the Sphinx sit on the city’s edge, while the Nile and thousands of years of history run through its heart. The cooler months (Oct–Apr) are best.', lead_fr:'Le Caire est la porte de l’Égypte antique — les pyramides de Gizeh et le Sphinx bordent la ville, tandis que le Nil et des millénaires d’histoire en traversent le cœur. Les mois plus frais (oct.–avr.) sont idéaux.', lead_ar:'القاهرة بوابة مصر القديمة — أهرامات الجيزة وأبو الهول على أطراف المدينة، بينما يجري النيل وآلاف السنين من التاريخ في قلبها. والأشهر الأبرد (أكتوبر–أبريل) هي الأفضل.',
    todo_en:['Stand before the Giza Pyramids','Explore the Egyptian Museum','Felucca ride on the Nile','Wander Khan el-Khalili bazaar'], todo_fr:['Se tenir devant les pyramides de Gizeh','Explorer le Musée égyptien','Balade en felouque sur le Nil','Flâner au bazar de Khan el-Khalili'], todo_ar:['الوقوف أمام أهرامات الجيزة','استكشاف المتحف المصري','جولة بالفلوكة على النيل','التجوّل في خان الخليلي']},
  {code:'TYO', slug:'tokyo', region:'as', trend:1, flag:'🇯🇵', cur:'JPY', rslug:'',
    lang_en:'Japanese', lang_fr:'Japonais', lang_ar:'اليابانية', ar_name:'طوكيو', fr_name:'Tokyo',
    bt_en:'Mar–May & Oct–Nov', bt_fr:'mars–mai & oct.–nov.', bt_ar:'مارس–مايو وأكتوبر–نوفمبر',
    en:'Neon-lit streets, ancient temples and the world’s best food scene.', fr:'Rues illuminées de néons, temples anciens et la meilleure scène culinaire du monde.', ar:'شوارع تضيئها النيون، معابد عريقة، وأفضل مشهد طعام في العالم.',
    lead_en:'Tokyo is a city of contrasts — centuries-old shrines beside neon skyscrapers, hushed gardens and the buzz of Shibuya. It’s endlessly explorable and famously safe, clean and punctual.', lead_fr:'Tokyo est une ville de contrastes — des sanctuaires séculaires côtoient des gratte-ciels de néon, des jardins paisibles et l’effervescence de Shibuya. Inépuisable à explorer, et réputée sûre, propre et ponctuelle.', lead_ar:'طوكيو مدينة التناقضات — معابد عمرها قرون إلى جانب ناطحات سحاب من النيون، حدائق هادئة وصخب شيبويا. لا ينتهي استكشافها، وتشتهر بالأمان والنظافة والانضباط.',
    todo_en:['Cross the Shibuya Scramble','Visit Senso-ji temple in Asakusa','Eat sushi at Toyosu market','Day-trip to Mount Fuji'], todo_fr:['Traverser le carrefour de Shibuya','Visiter le temple Senso-ji à Asakusa','Manger des sushis au marché de Toyosu','Excursion au mont Fuji'], todo_ar:['عبور تقاطع شيبويا الشهير','زيارة معبد سينسو-جي في أساكوسا','تناول السوشي في سوق تويوسو','رحلة يومية إلى جبل فوجي']},
  {code:'NYC', slug:'new-york', region:'am', trend:1, flag:'🇺🇸', cur:'USD', rslug:'',
    lang_en:'English', lang_fr:'Anglais', lang_ar:'الإنجليزية', ar_name:'نيويورك', fr_name:'New York',
    bt_en:'Apr–Jun & Sep–Nov', bt_fr:'avr.–juin & sep.–nov.', bt_ar:'أبريل–يونيو وسبتمبر–نوفمبر',
    en:'The city that never sleeps — skyscrapers, Broadway and world-class museums.', fr:'La ville qui ne dort jamais — gratte-ciels, Broadway et musées de renommée mondiale.', ar:'المدينة التي لا تنام — ناطحات سحاب، برودواي، ومتاحف عالمية.',
    lead_en:'New York packs more into a few square miles than almost anywhere: Central Park, Times Square, Broadway and food from every corner of the globe. Spring and autumn bring the kindest weather.', lead_fr:'New York concentre plus de choses au kilomètre carré que presque partout : Central Park, Times Square, Broadway et une cuisine venue du monde entier. Le printemps et l’automne offrent le climat le plus agréable.', lead_ar:'تجمع نيويورك في أميال قليلة أكثر من أي مكان تقريبًا: سنترال بارك، وتايمز سكوير، وبرودواي، وأطعمة من كل أنحاء العالم. والربيع والخريف يمنحان ألطف طقس.',
    todo_en:['See Central Park & the skyline','Catch a Broadway show','Visit the MoMA & the Met','Walk the Brooklyn Bridge'], todo_fr:['Voir Central Park et la skyline','Assister à un spectacle de Broadway','Visiter le MoMA et le Met','Traverser le pont de Brooklyn'], todo_ar:['زيارة سنترال بارك وأفق المدينة','حضور عرض في برودواي','زيارة متحفي موما والمتروبوليتان','عبور جسر بروكلين']},
  {code:'DPS', slug:'bali', region:'as', trend:1, flag:'🇮🇩', cur:'IDR', rslug:'',
    lang_en:'Indonesian', lang_fr:'Indonésien', lang_ar:'الإندونيسية', ar_name:'بالي', fr_name:'Bali',
    bt_en:'Apr–Oct (dry season)', bt_fr:'avr.–oct. (saison sèche)', bt_ar:'أبريل–أكتوبر (الموسم الجاف)',
    en:'Rice terraces, surf beaches and temples wrapped in tropical calm.', fr:'Rizières, plages de surf et temples baignés d’un calme tropical.', ar:'مدرّجات أرز، شواطئ للأمواج، ومعابد يغمرها هدوء استوائي.',
    lead_en:'Bali blends emerald rice terraces, surf-ready beaches, clifftop temples and a famously warm welcome — all at prices that stretch your budget. It’s a favourite for relaxation and adventure alike.', lead_fr:'Bali mêle rizières émeraude, plages propices au surf, temples perchés et un accueil chaleureux — le tout à des prix qui ménagent votre budget. Une destination de choix pour la détente comme l’aventure.', lead_ar:'تمزج بالي بين مدرّجات الأرز الزمردية، وشواطئ ركوب الأمواج، والمعابد على حافة الجِرف، وكرم الضيافة — كلّها بأسعار تكفي ميزانيتك. وهي وجهة مفضّلة للاسترخاء والمغامرة معًا.',
    todo_en:['Watch sunset at Uluwatu temple','Explore Ubud’s rice terraces','Surf or relax in Canggu','Chase inland waterfalls'], todo_fr:['Admirer le coucher de soleil au temple d’Uluwatu','Explorer les rizières d’Ubud','Surfer ou se détendre à Canggu','Découvrir les cascades de l’intérieur'], todo_ar:['مشاهدة الغروب عند معبد أولواتو','استكشاف مدرّجات أرز أوبود','ركوب الأمواج أو الاسترخاء في تشانغو','ملاحقة الشلالات الداخلية']},
  {code:'GIG', slug:'rio-de-janeiro', region:'am', trend:0, flag:'🇧🇷', cur:'BRL', rslug:'',
    lang_en:'Portuguese', lang_fr:'Portugais', lang_ar:'البرتغالية', ar_name:'ريو دي جانيرو', fr_name:'Rio de Janeiro',
    bt_en:'May–Oct (cooler, drier)', bt_fr:'mai–oct. (plus frais, plus sec)', bt_ar:'مايو–أكتوبر (أبرد وأجفّ)',
    en:'Iconic beaches, Christ the Redeemer and infectious carnival energy.', fr:'Plages mythiques, le Christ Rédempteur et l’énergie contagieuse du carnaval.', ar:'شواطئ أيقونية، تمثال المسيح الفادي، وطاقة الكرنفال المعدية.',
    lead_en:'Rio is mountains meeting the sea — Copacabana and Ipanema beaches, Christ the Redeemer above the clouds, and a rhythm of samba and sunshine. Spring and autumn dodge the peak-season crowds.', lead_fr:'Rio, c’est la montagne qui rencontre la mer — les plages de Copacabana et d’Ipanema, le Christ Rédempteur au-dessus des nuages, et un rythme de samba et de soleil. Le printemps et l’automne évitent la haute saison.', lead_ar:'ريو حيث تلتقي الجبال بالبحر — شاطئا كوباكابانا وإيبانيما، وتمثال المسيح الفادي فوق الغيوم، وإيقاع من السامبا والشمس. والربيع والخريف يتفاديان زحام الموسم.',
    todo_en:['Ride up to Christ the Redeemer','Relax on Copacabana & Ipanema','Cable car up Sugarloaf Mountain','Feel the rhythm in Lapa'], todo_fr:['Monter au Christ Rédempteur','Se détendre à Copacabana et Ipanema','Téléphérique du Pain de Sucre','Vivre le rythme de Lapa'], todo_ar:['الصعود إلى تمثال المسيح الفادي','الاسترخاء في كوباكابانا وإيبانيما','التلفريك إلى جبل شوغرلوف','الإحساس بالإيقاع في حي لابا']},
];

const L = {
  en:{dir:'ltr',lang:'en',home:'/',dest:'/destinations/',hotels:'/hotels',cars:'/cars',esim:'/esim',comp:'/compensation',
      nav:{flights:'Flights',hotels:'Hotels',cars:'Cars',esim:'eSIM',dest:'Destinations',blog:'Blog',comp:'Compensation'},
      hubTitle:'Destinations — World Travel Guide for Morocco | OasisDeal',
      hubDesc:'Travel guides for explorers worldwide — trending destinations, the best time to visit, highlights, and live flight prices from your city.',
      hubH:'Explore the world', hubIntro:'Travel guides for curious travellers — when to go, what to see, and the cheapest way to get there.',
      trending:'Trending now', regions:{eu:'Europe',me:'Middle East',as:'Asia',af:'Africa',am:'Americas'},
      from:'from', fromCasa:'Cheapest price', fromBase:'Cheapest from', perGuide:'live lowest price now',
      bestTime:'Best time to visit', why:'Why go', currency:'Currency', language:'Language', region:'Region',
      todoH:'Top things to do', gettingH:'Getting there',
      gettingP:'The cheapest prices from your city are shown live above and change daily. Compare hundreds of airlines in one search and book directly, with no booking fees from us.',
      planH:'Plan your trip',
      flights:'Find flights →', hotels:'Compare hotels →', esim:'Get a travel eSIM →', rights:'Know your rights →',
      faqH:'Frequently asked questions', back:'← All destinations', guideTag:'Destination guide', imgcredit:'Illustration',
      note:'Live starting price from our partners; the final price is set by the airline. Visa and entry rules change — always confirm with official sources before booking.', secure:'Secure & free to use · No booking fees',
      mt:function(n){return n+' Travel Guide — Best Time, Things to Do & Cheap Flights | OasisDeal';},
      md:function(n){return 'Travel guide to '+n+': the best time to visit, top things to do, currency and language, and live flight prices from your city.';}},
  fr:{dir:'ltr',lang:'fr',home:'/fr/',dest:'/fr/destinations/',hotels:'/hotels',cars:'/cars',esim:'/esim',comp:'/compensation',
      nav:{flights:'Vols',hotels:'Hôtels',cars:'Voitures',esim:'eSIM',dest:'Destinations',blog:'Blog',comp:'Indemnisation'},
      hubTitle:'Destinations — Guide de voyage mondial | OasisDeal',
      hubDesc:'Guides de voyage pour les voyageurs curieux — destinations tendance, meilleure période, incontournables et prix de vols en direct depuis votre ville.',
      hubH:'Explorez le monde', hubIntro:'Guides de voyage pour les voyageurs curieux — quand partir, quoi voir et comment y aller au meilleur prix.',
      trending:'Tendances du moment', regions:{eu:'Europe',me:'Moyen-Orient',as:'Asie',af:'Afrique',am:'Amériques'},
      from:'à partir de', fromCasa:'Tarif le moins cher', fromBase:'Le moins cher depuis', perGuide:'tarif le plus bas en direct',
      bestTime:'Meilleure période', why:'Pourquoi y aller', currency:'Devise', language:'Langue', region:'Région',
      todoH:'À faire absolument', gettingH:'Comment y aller',
      gettingP:'Les tarifs les moins chers depuis votre ville sont affichés en direct ci-dessus et changent chaque jour. Comparez des centaines de compagnies en une recherche et réservez directement, sans frais de réservation de notre part.',
      planH:'Planifiez votre voyage',
      flights:'Trouver des vols →', hotels:'Comparer les hôtels →', esim:'Obtenir une eSIM voyage →', rights:'Connaître vos droits →',
      faqH:'Questions fréquentes', back:'← Toutes les destinations', guideTag:'Guide de destination', imgcredit:'Illustration',
      note:'Tarif de départ en direct via nos partenaires ; le prix final est fixé par la compagnie. Les règles de visa et d’entrée changent — vérifiez toujours auprès des sources officielles avant de réserver.', secure:'Sécurisé et gratuit · Sans frais',
      mt:function(n){return 'Guide de voyage à '+n+' — Meilleure période, à faire & vols pas chers | OasisDeal';},
      md:function(n){return 'Guide de voyage à '+n+' : meilleure période, incontournables, devise et langue, et prix de vols en direct depuis votre ville.';}},
  ar:{dir:'rtl',lang:'ar',home:'/ar/',dest:'/ar/destinations/',hotels:'/hotels',cars:'/cars',esim:'/esim',comp:'/compensation',
      nav:{flights:'رحلات',hotels:'فنادق',cars:'سيارات',esim:'eSIM',dest:'الوجهات',blog:'المدوّنة',comp:'تعويضات'},
      hubTitle:'الوجهات — دليل السفر حول العالم | OasisDeal',
      hubDesc:'أدلة سفر للمسافرين حول العالم — الوجهات الرائجة، أفضل وقت للزيارة، أبرز المعالم، وأسعار رحلات مباشرة من مدينتك.',
      hubH:'اكتشف العالم', hubIntro:'أدلة سفر للمسافرين الفضوليين — متى تسافر، وماذا تشاهد، وكيف تصل بأرخص سعر.',
      trending:'الرائج الآن', regions:{eu:'أوروبا',me:'الشرق الأوسط',as:'آسيا',af:'أفريقيا',am:'الأمريكتان'},
      from:'ابتداءً من', fromCasa:'أرخص سعر', fromBase:'الأرخص من', perGuide:'أرخص سعر مباشر الآن',
      bestTime:'أفضل وقت للزيارة', why:'لماذا تزورها', currency:'العملة', language:'اللغة', region:'المنطقة',
      todoH:'أبرز ما تفعله', gettingH:'كيف تصل',
      gettingP:'أرخص الأسعار من مدينتك مبيّنة مباشرة أعلاه وتتغيّر يوميًا. قارن مئات شركات الطيران في بحث واحد واحجز مباشرةً، دون أي رسوم حجز من جهتنا.',
      planH:'خطّط لرحلتك',
      flights:'ابحث عن رحلات →', hotels:'قارن الفنادق →', esim:'احصل على eSIM للسفر →', rights:'اعرف حقوقك →',
      faqH:'أسئلة شائعة', back:'→ كل الوجهات', guideTag:'دليل وجهة', imgcredit:'رسم توضيحي',
      note:'سعر البداية مباشر من شركائنا؛ السعر النهائي تحدّده شركة الطيران. قواعد التأشيرة والدخول تتغيّر — تأكّد دائمًا من المصادر الرسمية قبل الحجز.', secure:'آمن ومجاني · دون رسوم حجز',
      mt:function(n){return 'دليل السفر إلى '+n+' — أفضل وقت، أبرز الأنشطة، ورحلات رخيصة | OasisDeal';},
      md:function(n){return 'دليل السفر إلى '+n+': أفضل وقت للزيارة، أبرز الأنشطة، العملة واللغة، وأسعار رحلات مباشرة من مدينتك.';}},
};

function nameEN(d){ return d.slug.split('-').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' '); }
function dname(d,lang){ return lang==='en'?nameEN(d): lang==='fr'?d.fr_name : d.ar_name; }
function hi(d,lang){ return lang==='en'?d.en : lang==='fr'?d.fr : d.ar; }
function lead(d,lang){ return lang==='en'?d.lead_en : lang==='fr'?d.lead_fr : d.lead_ar; }
function todo(d,lang){ return lang==='en'?d.todo_en : lang==='fr'?d.todo_fr : d.todo_ar; }
function bt(d,lang){ return lang==='en'?d.bt_en : lang==='fr'?d.bt_fr : d.bt_ar; }
function langName(d,lang){ return lang==='en'?d.lang_en : lang==='fr'?d.lang_fr : d.lang_ar; }
function isEuro(d){ return d.region==='eu'; }
function pre(lang){ return lang==='en'?'':'/'+lang; }
function homeName(lang){ return lang==='fr'?'Accueil':lang==='ar'?'الرئيسية':'Home'; }
function breadcrumb(items){ return {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':items.map(function(it,i){var o={'@type':'ListItem','position':i+1,'name':it.n}; if(it.u) o.item=it.u; return o;})}; }

const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#E8A33D"/><path d="M16 22c0-7 3-10 8-11-1 6-3 9-8 11z" fill="#241F5E"/><path d="M16 22c0-7-3-10-8-11 1 6 3 9 8 11z" fill="#4B3FCB"/><rect x="14.6" y="20" width="2.8" height="5" rx="1" fill="#241F5E"/></svg>';

// Feature image: real photo if present, else a branded SVG banner.
function featureImg(d, lang){
  var exts=['webp','jpg','jpeg','png'];
  for(var i=0;i<exts.length;i++){
    var rel='images/destinations/'+d.slug+'.'+exts[i];
    if(fs.existsSync(path.join(ROOT,rel))){
      return '<img class="dg-photo" src="/'+rel+'" alt="'+dname(d,lang)+'" loading="lazy" decoding="async" width="1280" height="540" />';
    }
  }
  return svgBanner(d);
}
function svgBanner(d){
  // simple branded travel banner (gradient sky + skyline silhouette + sun + plane)
  return '<svg class="dg-photo dg-svg" viewBox="0 0 1280 460" role="img" aria-label="'+nameEN(d)+'" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><linearGradient id="g'+d.code+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4B3FCB"/><stop offset="1" stop-color="#241F5E"/></linearGradient></defs>'
    +'<rect width="1280" height="460" fill="url(#g'+d.code+')"/>'
    +'<circle cx="1050" cy="120" r="56" fill="#E8A33D" opacity="0.95"/>'
    +'<path d="M120 150 l40 -14 -10 34 z" fill="#F4ECDD" opacity="0.9"/>'
    +'<g fill="#F4ECDD" opacity="0.16">'
    +'<rect x="80" y="300" width="90" height="160"/><rect x="190" y="250" width="70" height="210"/><rect x="280" y="320" width="110" height="140"/>'
    +'<rect x="410" y="220" width="60" height="240"/><rect x="490" y="300" width="120" height="160"/><rect x="630" y="260" width="80" height="200"/>'
    +'<rect x="730" y="330" width="130" height="130"/><rect x="880" y="240" width="70" height="220"/><rect x="970" y="310" width="120" height="150"/><rect x="1110" y="270" width="90" height="190"/></g>'
    +'<text x="'+(d.region==='af'||1?'48':'48')+'" y="120" font-family="Fraunces, Georgia, serif" font-size="64" fill="#FFFBF5" font-weight="600" opacity="0.95">'+nameEN(d)+'</text>'
    +'</svg>';
}

var NAVJS='<script>(function(){var C=\'.nav-div{display:inline-block;width:1px;height:18px;background:var(--line);margin:0 6px;vertical-align:middle;}.nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);cursor:pointer;}.nav-toggle span{display:block;width:20px;height:2px;background:var(--ink);border-radius:2px;transition:transform .2s,opacity .2s;}.nav-row.menu-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg);}.nav-row.menu-open .nav-toggle span:nth-child(2){opacity:0;}.nav-row.menu-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}@media(max-width:1120px){.nav-div{display:none!important;}.nav-row{flex-wrap:nowrap!important;height:60px;position:relative;}.nav-toggle{display:flex;}.nav-links{position:absolute;top:100%;inset-inline-start:0;width:100%;flex-direction:column;align-items:stretch;gap:0!important;background:var(--paper);border:1px solid var(--line);border-radius:0 0 16px 16px;padding:8px;box-shadow:0 14px 30px rgba(24,26,46,.14);display:none!important;z-index:60;}.nav-row.menu-open .nav-links{display:flex!important;}.nav-links .nav-link{display:block!important;padding:13px 12px;font-size:1rem;border-bottom:1px solid var(--line);}.nav-links .btn{margin:10px 4px 4px;justify-content:center;}.nav-links .rp-langs{display:flex;justify-content:center;gap:16px;padding:12px;}.nav-links .rp-langs a{color:var(--ink);opacity:.75;}.nav-links .rp-langs a.on{opacity:1;}}\';function I(){var r=document.querySelector(".nav-row");if(!r||r.querySelector(".nav-toggle"))return;var l=r.querySelector(".nav-links");if(!l)return;var s=document.createElement("style");s.textContent=C;document.head.appendChild(s);var b=document.createElement("button");b.className="nav-toggle";b.type="button";b.setAttribute("aria-label","Menu");b.innerHTML="<span></span><span></span><span></span>";b.addEventListener("click",function(){r.classList.toggle("menu-open");});r.appendChild(b);l.addEventListener("click",function(e){if(e.target.closest("a"))r.classList.remove("menu-open");});}if(document.readyState!=="loading")I();else document.addEventListener("DOMContentLoaded",I);})();</script>';

function nav(lang, langsHtml){ var x=L[lang];
  return '<nav class="nav"><div class="container nav-row"><a class="logo" href="'+x.home+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a><div class="nav-links">'
    +'<a class="nav-link" href="'+x.home+'">'+x.nav.flights+'</a><a class="nav-link" href="'+x.hotels+'">'+x.nav.hotels+'</a><a class="nav-link" href="'+x.cars+'">'+x.nav.cars+'</a><a class="nav-link" href="'+x.esim+'">'+x.nav.esim+'</a><a class="nav-link" href="'+x.comp+'">'+x.nav.comp+'</a><span class="nav-div"></span><a class="nav-link active" href="'+x.dest+'">'+x.nav.dest+'</a><a class="nav-link" href="'+(lang==='en'?'':'/'+lang)+'/blog/">'+x.nav.blog+'</a>'
    +(langsHtml?'<span class="rp-langs">'+langsHtml+'</span>':'')+'</div></div></nav>'; }
function footer(lang){ var x=L[lang]; return '<footer class="footer"><div class="container"><div class="footer-trust">🔒 '+x.secure+' · Travelpayouts · Stay22 · AirHelp</div><div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span></div></div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS; }

var EXTRA = '<style>'
  +'.rp-hero{background:linear-gradient(160deg,var(--majorelle) 0%,var(--majorelle-deep) 100%);color:#fff;padding:54px 0 48px}.rp-hero h1{color:#fff;font-size:clamp(2rem,5vw,3.1rem)}.rp-hero .eyebrow{color:rgba(255,255,255,.85)}'
  +'.rp-price{font-family:"Fraunces",serif;font-size:2.4rem;font-weight:600;margin-top:16px;color:#fff}.rp-price .pre{display:block;font-family:"IBM Plex Mono",monospace;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;opacity:.85;font-weight:400;margin-bottom:4px}.rp-price small{display:block;font-family:"Inter",sans-serif;font-size:.85rem;font-weight:400;opacity:.85;margin-top:4px}'
  +'.rp-facts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0}@media(max-width:640px){.rp-facts{grid-template-columns:1fr}}'
  +'.rp-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:22px}.rp-card h2{font-size:1.15rem;margin-bottom:8px}'
  +'.rp-cross{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:18px 0}.rp-cross .rp-card{display:flex;flex-direction:column;gap:10px}.rp-cross .btn{margin-top:auto}'
  +'.rp-faq details{border-bottom:1px solid var(--line);padding:14px 0}.rp-faq summary{cursor:pointer;font-weight:600;font-size:1.05rem}.rp-faq p{color:var(--ink-soft);margin-top:8px}.rp-note{font-size:.82rem;color:var(--ink-soft);margin-top:22px}'
  +'.nav .rp-langs a{margin-inline-start:8px;color:var(--ink-soft);text-decoration:none;font-size:.85rem}.nav .rp-langs a.on{color:var(--ink);font-weight:700;text-decoration:underline}'
  // blog
  +'.dg-col{max-width:820px;margin:0 auto}'
  +'.dg-figure{margin:-28px 0 0}.dg-photo{display:block;width:100%;height:auto;max-height:460px;object-fit:cover;border-radius:18px;border:1px solid var(--line);box-shadow:0 20px 44px rgba(24,26,46,.12)}.dg-svg{aspect-ratio:1280/460}'
  +'.dg-article h2{font-size:1.5rem;margin:34px 0 12px}.dg-lead{font-size:1.12rem;line-height:1.7;color:var(--ink);margin-top:26px}.dg-article p{line-height:1.7;color:var(--ink-soft)}'
  +'.dg-todo{list-style:none;padding:0;margin:6px 0;display:grid;gap:10px}.dg-todo li{position:relative;padding:12px 16px 12px 42px;background:var(--paper);border:1px solid var(--line);border-radius:12px;color:var(--ink)}.dg-todo li::before{content:"✦";position:absolute;inset-inline-start:16px;color:var(--clay-deep);font-weight:700}'
  +'[dir=rtl] .dg-todo li{padding:12px 42px 12px 16px}'
  +'.dg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}'
  +'.dg-card{position:relative;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:20px;display:block;text-decoration:none;color:inherit;transition:border-color .15s,transform .15s}'
  +'.dg-card:hover{border-color:var(--majorelle);transform:translateY(-2px)}'
  +'.dg-flag{font-size:1.8rem;line-height:1}.dg-name{font-family:"Fraunces",serif;font-size:1.2rem;margin:8px 0 2px}'
  +'.dg-region{font-family:"IBM Plex Mono",monospace;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}'
  +'.dg-why{color:var(--ink-soft);font-size:.9rem;margin-top:10px;line-height:1.5}'
  +'.dg-price{margin-top:12px;font-family:"IBM Plex Mono",monospace;font-size:.82rem;color:var(--clay-deep);font-weight:600}'
  +'.dg-badge{position:absolute;top:14px;inset-inline-end:14px;background:var(--saffron);color:#241F5E;font-family:"IBM Plex Mono",monospace;font-size:.58rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px}'
  +'.dg-sec h2{font-size:1.4rem;margin:34px 0 14px}</style>';

function liveScript(){
  // Universal: detect the visitor's nearest airport, then show fares + label from THEIR city.
  return '<script>(function(){var FLY="https://fly.oasisdeal.com/?flightSearch=",ORIG="CMN",CITY="";function ddmm(){var x=new Date(Date.now()+21*864e5);return ("0"+x.getDate()).slice(-2)+("0"+(x.getMonth()+1)).slice(-2);}'
    +'function wire(){'
    +'Array.prototype.forEach.call(document.querySelectorAll("[data-fly]"),function(a){a.href=FLY+ORIG+ddmm()+a.getAttribute("data-fly")+"1";});'
    +'if(CITY){var fl=document.getElementById("dfrom");if(fl)fl.textContent=fl.getAttribute("data-base")+" "+CITY;}'
    +'Array.prototype.forEach.call(document.querySelectorAll("[data-price]"),function(el){fetch("https://oasisdeal-fares.pages.dev/api/fares?origin="+ORIG+"&destination="+el.getAttribute("data-price")+"&currency=usd").then(function(r){return r.json();}).then(function(d){el.textContent=(d&&d.price)?("$"+Math.round(d.price)):"";}).catch(function(){el.textContent="";});});}'
    +'fetch("https://oasisdeal-fares.pages.dev/api/whereami").then(function(r){return r.json();}).then(function(g){if(g&&g.origin)ORIG=g.origin;if(g&&g.city)CITY=g.city;wire();}).catch(function(){wire();});'
    +'})();</script>';
}

function head(lang, title, desc, canon, alts){
  return '<!DOCTYPE html>\n<html lang="'+L[lang].lang+'" dir="'+L[lang].dir+'">\n<head>\n<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    +'<title>'+title+'</title>\n<meta name="description" content="'+desc+'" />\n<link rel="canonical" href="'+canon+'" />\n'+alts+'\n'
    +'<meta property="og:title" content="'+title+'" /><meta property="og:description" content="'+desc+'" /><meta property="og:url" content="'+canon+'" /><meta property="og:type" content="website" />\n'
    +'<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    +'<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/assets/site.css" />\n'+EXTRA+'\n</head>\n<body>\n';
}

function altsFor(p){ return ['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+p+'" />';}).join('\n')+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com'+p+'" />'; }
function langSwitch(lang, p){ return ['en','fr','ar'].map(function(lg){return '<a class="'+(lg===lang?'on':'')+'" href="'+(lg==='en'?'':'/'+lg)+p+'">'+lg.toUpperCase()+'</a>';}).join(''); }

function card(title, sub, btnClass, attr, label){
  return '<div class="rp-card"><h2>'+title+'</h2><p style="color:var(--ink-soft);flex:1">'+sub+'</p><a class="btn '+btnClass+'" '+attr+'>'+label+'</a></div>';
}

function guidePage(d, lang){
  var x=L[lang], n=dname(d,lang), p='/destinations/'+d.slug;
  var faqs=[
    [ (lang==='en'?'When is the best time to visit '+n+'?': lang==='fr'?'Quelle est la meilleure période pour visiter '+n+' ?':'ما أفضل وقت لزيارة '+n+'؟'),
      (lang==='en'?'The best months are usually '+bt(d,lang)+' for pleasant weather. Prices are often lower mid-week and outside school holidays.': lang==='fr'?'Les meilleurs mois sont généralement '+bt(d,lang)+' pour un temps agréable. Les tarifs sont souvent plus bas en milieu de semaine et hors vacances scolaires.':'أفضل الأشهر عادةً '+bt(d,lang)+' لطقس لطيف. وغالبًا تكون الأسعار أقل في منتصف الأسبوع وخارج العطل المدرسية.') ],
    [ (lang==='en'?'How much is a flight to '+n+'?': lang==='fr'?'Combien coûte un vol pour '+n+' ?':'كم تكلّف رحلة إلى '+n+'؟'),
      (lang==='en'?'Prices change daily and depend on where you fly from — see the live starting price above for your city. Compare hundreds of airlines in one search to grab the lowest price for your dates.': lang==='fr'?'Les tarifs changent chaque jour et dépendent de votre ville de départ — voyez le prix de départ en direct ci-dessus. Comparez des centaines de compagnies en une recherche pour le tarif le plus bas.':'تتغيّر الأسعار يوميًا وتعتمد على مدينة انطلاقك — انظر سعر البداية المباشر أعلاه لمدينتك. قارن مئات الشركات في بحث واحد للحصول على أرخص سعر لتواريخك.') ],
    [ (lang==='en'?'Do I need a visa for '+n+'?': lang==='fr'?'Ai-je besoin d’un visa pour '+n+' ?':'هل أحتاج تأشيرة لـ '+n+'؟'),
      (lang==='en'?'It depends on your nationality, and entry rules change often. Always confirm the current requirements for your passport with the official embassy or consulate before booking — we compare flights, not visas.': lang==='fr'?'Cela dépend de votre nationalité, et les règles d’entrée changent souvent. Vérifiez toujours les conditions actuelles pour votre passeport auprès de l’ambassade ou du consulat officiel avant de réserver — nous comparons les vols, pas les visas.':'يعتمد ذلك على جنسيتك، وقواعد الدخول تتغيّر كثيرًا. تأكّد دائمًا من المتطلبات الحالية لجواز سفرك لدى السفارة أو القنصلية الرسمية قبل الحجز — نحن نقارن الرحلات لا التأشيرات.') ],
  ];
  var faqLd={'@context':'https://schema.org','@type':'FAQPage','mainEntity':faqs.map(function(q){return {'@type':'Question','name':q[0],'acceptedAnswer':{'@type':'Answer','text':q[1]}};})};
  var flightsAttr = 'href="#" data-fly="'+d.code+'"';
  var flightsSub = lang==='en'?'Cheapest prices to '+n : lang==='fr'?'Tarifs les moins chers vers '+n : 'أرخص الأسعار إلى '+n;
  var crossHtml = '<div class="rp-cross">'
    + card(lang==='en'?'Flights':lang==='fr'?'Vols':'الرحلات', flightsSub, 'btn-primary', flightsAttr, x.flights)
    + card(lang==='en'?'Hotels':lang==='fr'?'Hôtels':'الفنادق', (lang==='en'?'Compare stays in '+n:lang==='fr'?'Comparez les hôtels à '+n:'قارن الإقامة في '+n), 'btn-ghost', 'href="'+x.hotels+'"', x.hotels)
    + card('eSIM', (lang==='en'?'Stay online in '+n:lang==='fr'?'Restez connecté à '+n:'ابقَ متصلًا في '+n), 'btn-ghost', 'href="'+x.esim+'"', x.esim)
    + (isEuro(d)? card(lang==='en'?'Your rights':lang==='fr'?'Vos droits':'حقوقك', (lang==='en'?'Delayed or cancelled flight?':lang==='fr'?'Vol retardé ou annulé ?':'رحلة متأخرة أو ملغاة؟'), 'btn-ghost', 'href="'+pre(lang)+'/flight-rights"', x.rights) : '')
    + '</div>';
  var todos='<ul class="dg-todo">'+todo(d,lang).map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul>';
  var crumbLd=breadcrumb([{n:homeName(lang),u:'https://oasisdeal.com'+x.home},{n:x.nav.dest,u:'https://oasisdeal.com'+x.dest},{n:n,u:'https://oasisdeal.com'+pre(lang)+p}]);

  return head(lang, x.mt(n), x.md(n), 'https://oasisdeal.com'+pre(lang)+p, altsFor(p))
    + nav(lang, langSwitch(lang,p))
    + '<script type="application/ld+json">'+JSON.stringify(faqLd)+'</script>'
    + '<script type="application/ld+json">'+JSON.stringify(crumbLd)+'</script>'
    + '<header class="rp-hero"><div class="container"><div class="dg-col">'
    + '<div class="eyebrow" style="margin-bottom:8px">'+d.flag+' '+x.regions[d.region]+' · '+x.guideTag+'</div>'
    + '<h1>'+n+'</h1>'
    + '<p style="opacity:.92;margin-top:10px;font-size:1.05rem">'+hi(d,lang)+'</p>'
    + '<div class="rp-price"><span class="pre" id="dfrom" data-base="'+x.fromBase+'">'+x.fromCasa+'</span><span data-price="'+d.code+'">—</span><small>'+x.perGuide+'</small></div>'
    + '</div></div></header>'
    + '<main class="container" style="padding-top:0;padding-bottom:40px"><div class="dg-col">'
    + '<figure class="dg-figure">'+featureImg(d,lang)+'</figure>'
    + '<article class="dg-article">'
    + '<p class="dg-lead">'+lead(d,lang)+'</p>'
    + '<h2>'+x.todoH+'</h2>'+todos
    + '<h2>'+x.gettingH+'</h2><p>'+x.gettingP+'</p>'
    + '<div class="rp-facts">'
    + '<div class="rp-card"><h2>'+x.bestTime+'</h2><p style="color:var(--ink-soft)">'+bt(d,lang)+'</p></div>'
    + '<div class="rp-card"><h2>'+x.currency+'</h2><p style="color:var(--ink-soft)">'+d.cur+'</p></div>'
    + '<div class="rp-card"><h2>'+x.language+'</h2><p style="color:var(--ink-soft)">'+langName(d,lang)+'</p></div>'
    + '<div class="rp-card"><h2>'+x.region+'</h2><p style="color:var(--ink-soft)">'+x.regions[d.region]+'</p></div>'
    + '</div>'
    + '<h2>'+x.planH+'</h2>'+crossHtml
    + '<section class="rp-faq" style="margin-top:24px"><h2>'+x.faqH+'</h2>'
    + faqs.map(function(q){return '<details><summary>'+q[0]+'</summary><p>'+q[1]+'</p></details>';}).join('')
    + '</section>'
    + '<p class="rp-note">'+x.note+'</p>'
    + '<p style="margin-top:18px"><a href="'+x.dest+'" style="color:var(--majorelle);font-weight:600;text-decoration:none">'+x.back+'</a></p>'
    + '</article>'
    + '</div></main>'
    + footer(lang) + liveScript() + STAY22+'\n</body>\n</html>\n';
}

function destCard(d, lang){
  var p='/destinations/'+d.slug, href=(lang==='en'?'':'/'+lang)+p;
  return '<a class="dg-card" href="'+href+'">'
    + (d.trend? '<span class="dg-badge">'+L[lang].trending+'</span>':'')
    + '<div class="dg-flag">'+d.flag+'</div>'
    + '<div class="dg-name">'+dname(d,lang)+'</div>'
    + '<div class="dg-region">'+L[lang].regions[d.region]+'</div>'
    + '<div class="dg-why">'+hi(d,lang)+'</div>'
    + '<div class="dg-price">'+L[lang].from+' <span data-price="'+d.code+'">—</span></div>'
    + '</a>';
}

function hubPage(lang){
  var x=L[lang], p='/destinations/';
  var trend = DEST.filter(function(d){return d.trend;});
  var trendHtml = '<section class="dg-sec"><h2>🔥 '+x.trending+'</h2><div class="dg-grid">'+trend.map(function(d){return destCard(d,lang);}).join('')+'</div></section>';
  var order=['eu','me','as','af','am'];
  var regionsHtml = order.map(function(rk){
    var list=DEST.filter(function(d){return d.region===rk;});
    if(!list.length) return '';
    return '<section class="dg-sec"><h2>'+x.regions[rk]+'</h2><div class="dg-grid">'+list.map(function(d){return destCard(d,lang);}).join('')+'</div></section>';
  }).join('');
  var crumbLd=breadcrumb([{n:homeName(lang),u:'https://oasisdeal.com'+x.home},{n:x.nav.dest,u:'https://oasisdeal.com'+x.dest}]);
  return head(lang, x.hubTitle, x.hubDesc, 'https://oasisdeal.com'+pre(lang)+p, altsFor(p))
    + nav(lang, langSwitch(lang,p))
    + '<script type="application/ld+json">'+JSON.stringify(crumbLd)+'</script>'
    + '<header class="rp-hero"><div class="container"><h1>'+x.hubH+'</h1><p style="opacity:.92;max-width:660px;margin-top:10px;font-size:1.05rem">'+x.hubIntro+'</p></div></header>'
    + '<main class="container" style="padding-top:20px;padding-bottom:44px">'+trendHtml+regionsHtml+'</main>'
    + footer(lang) + liveScript() + STAY22+'\n</body>\n</html>\n';
}

function ensure(p){fs.mkdirSync(p,{recursive:true});}
function write(rel,html){var ff=path.join(ROOT,rel);ensure(path.dirname(ff));fs.writeFileSync(ff,html);}

var count=0;
['en','fr','ar'].forEach(function(lang){
  var base=lang==='en'?'destinations':path.join(lang,'destinations');
  DEST.forEach(function(d){ write(path.join(base,d.slug+'.html'), guidePage(d,lang)); count++; });
  write(path.join(base,'index.html'), hubPage(lang));
});
console.log('wrote', count, 'destination guides +', 3, 'hubs');

// images folder + which destinations still need a photo
ensure(path.join(ROOT,'images','destinations'));
var missing=DEST.filter(function(d){return !['webp','jpg','jpeg','png'].some(function(e){return fs.existsSync(path.join(ROOT,'images','destinations',d.slug+'.'+e));});}).map(function(d){return d.slug;});
console.log('destinations using SVG fallback (need a photo):', missing.length?missing.join(', '):'none');

// merge destination URLs into sitemap.xml (idempotent)
var destUrls=[];
['','/fr','/ar'].forEach(function(pre){
  destUrls.push('https://oasisdeal.com'+pre+'/destinations/');
  DEST.forEach(function(d){ destUrls.push('https://oasisdeal.com'+pre+'/destinations/'+d.slug); });
});
var smPath=path.join(ROOT,'sitemap.xml');
if(fs.existsSync(smPath)){
  var sm=fs.readFileSync(smPath,'utf8');
  destUrls.forEach(function(u){ if(sm.indexOf('<loc>'+u+'</loc>')===-1){ sm=sm.replace('</urlset>','  <url><loc>'+u+'</loc></url>\n</urlset>'); } });
  fs.writeFileSync(smPath,sm);
  console.log('merged', destUrls.length, 'destination urls into sitemap.xml');
}
fs.writeFileSync(path.join(ROOT,'.dest-urls.json'), JSON.stringify(destUrls));

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
    +'<div class="footer-social"><script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async></script><div class="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="6a425cb3f6d6bcdc734d3d22" data-style-height="52px" data-style-width="100%" data-token="da476c82-b569-4dfe-bb19-b4af4c691150"><a href="https://www.trustpilot.com/review/oasisdeal.com" target="_blank" rel="noopener">Trustpilot</a></div></div>'+'<div class="footer-trust">🔒 '+T.secure+' · Travelpayouts · Stay22 · AirHelp</div>'
    +'<div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span></div>'
    +'</div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS;
}
function footer(lang){return fullFooter(lang);}

