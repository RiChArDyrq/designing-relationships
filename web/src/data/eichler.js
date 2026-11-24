/* ---------- Eichler preset (read from the drawing; base image 883 × 983 px) ---------- */
const EICHLER={image_size:[883,983],
 scale_line:{a:[70,218],b:[295,218],meters:5.33},
 rooms:[
 {name:'卧室1 Bedroom 1',type:'bedroom',polygon:[[70,218],[295,218],[295,367],[70,367]]},
 {name:'卫生间1 Bath 1',type:'bathroom',polygon:[[70,371],[180,371],[180,446],[70,446]]},
 {name:'卧室2 Bedroom 2',type:'bedroom',polygon:[[70,452],[219,452],[219,581],[70,581]]},
 {name:'卫生间2 Bath 2',type:'bathroom',polygon:[[70,588],[219,588],[219,638],[172,638],[172,692],[70,692]]},
 {name:'卧室3 Bedroom 3',type:'bedroom',polygon:[[70,697],[214,697],[214,826],[70,826]]},
 {name:'卧室4 Bedroom 4',type:'bedroom',polygon:[[252,670],[374,670],[374,826],[252,826]]},
 {name:'走廊 Hall',type:'corridor',polygon:[[250,369],[294,369],[294,665],[250,665],[250,700],[172,700],[172,642],[221,642],[221,548],[250,548]]},
 {name:'多功能室 Multi-purpose',type:'other',polygon:[[298,174],[490,174],[490,408],[298,408]]},
 {name:'厨房 Kitchen',type:'kitchen',polygon:[[492,224],[610,224],[610,353],[492,353]]},
 {name:'餐厅 Dining',type:'dining',polygon:[[612,174],[757,174],[757,353],[612,353]]},
 {name:'客厅 Living',type:'living',polygon:[[492,356],[757,356],[757,624],[577,624],[577,408],[492,408]]},
 {name:'中央庭院 Atrium',type:'courtyard',polygon:[[298,411],[574,411],[574,640],[376,640],[376,667],[298,667]]},
 {name:'入口步道 Entry walk',type:'entrance',polygon:[[377,643],[455,643],[455,895],[377,895]]},
 {name:'车棚 Carport',type:'garage',polygon:[[458,692],[570,692],[570,895],[458,895]]},
 {name:'车库 Garage',type:'garage',polygon:[[574,628],[708,628],[708,702],[757,702],[757,890],[574,890]]},
 {name:'设备间 A.C./W.H.',type:'storage',polygon:[[711,628],[757,628],[757,699],[711,699]]},
 {name:'混凝土露台 Patio',type:'balcony',polygon:[[298,16],[757,16],[757,166],[298,166]]}],
 connections:[
 {kind:'door',a:[256,367],b:[290,367]},{kind:'door',a:[128,369],b:[156,369]},{kind:'opening',a:[296,372],b:[296,405]},
 {kind:'door',a:[220,551],b:[220,578]},{kind:'door',a:[172,662],b:[172,689]},{kind:'door',a:[180,698],b:[210,698]},
 {kind:'door',a:[251,673],b:[251,697]},{kind:'door',a:[69,612],b:[69,645]},{kind:'door',a:[150,217],b:[222,217]},
 {kind:'door',a:[388,170],b:[442,170]},{kind:'door',a:[622,170],b:[688,170]},
 {kind:'opening',a:[491,240],b:[491,350]},{kind:'opening',a:[611,240],b:[611,350]},{kind:'opening',a:[620,354],b:[750,354]},
 {kind:'opening',a:[500,354],b:[600,354]},{kind:'opening',a:[491,360],b:[491,405]},
 {kind:'door',a:[576,520],b:[576,600]},{kind:'door',a:[500,410],b:[545,410]},{kind:'door',a:[300,669],b:[370,669]},
 {kind:'door',a:[385,642],b:[428,642]},{kind:'opening',a:[380,896],b:[452,896]},{kind:'opening',a:[456,700],b:[456,880]},
 {kind:'opening',a:[462,896],b:[566,896]},{kind:'opening',a:[580,891],b:[750,891]},{kind:'door',a:[758,640],b:[758,695]},
 {kind:'door',a:[580,626],b:[606,626]},{kind:'opening',a:[758,30],b:[758,150]}]};
/* Recognize short printed floor-plan labels from image pixels. The vocabulary contains
   names and types only; every location and line break comes from the uploaded image. */