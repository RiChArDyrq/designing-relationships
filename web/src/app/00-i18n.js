
// Keep UI copy separate from the plan, including names transcribed from the drawing.
const englishCopy = new Map(`
床位与通道|Beds and routes
未找到同时满足卧室形状、床型和门口至床侧通行的摆法。请核对比例尺、卧室目标面积和直连门。|No bedroom met the shape, bed size and bedside access requirements. Check the scale, target area and required doorways.
客厅、餐厅或书房的连续使用面积不足。请调整相邻空间的目标面积或锁定设置。|Too little contiguous floor area in a living room, dining room or study. Review adjoining room targets or locks.
部分分区会合并相邻房间之间的细墙缝。|Some partitions join thin wall-face gaps between adjacent rooms.
门口至床侧的虚线表示已核验的 0.60 m 通道。|Dashed routes from openings to the bed side have 0.60 m clear width.
该卧室没有标注出入口。|No opening is marked for this bedroom.
已校准时，主卧按 1.50 × 2.00 m 双人床核验。|With a calibrated scale, a primary bedroom is checked with a 1.50 × 2.00 m bed.
参考床位|Bed footprints
床侧预留 0.60 m，门口留出 0.60 m。|Allows 0.60 m along one bed side and keeps the bed clear of a 0.60 m doorway approach.
设置比例尺可测试实际床位。|Calibrate the scale to test a physical bed footprint.
锁定轮廓中未找到参考床位。|No reference bed fits the locked outline in this search.
Designing Relationships · 平面识别与关系编辑|Designing Relationships · Plan recognition and graph editing
① 标注平面|① Annotate plan
② 改关系 → 生成|② Edit graph & generate
⬆ 上传平面图 / 工程文件|⬆ Open plan image / project
加载示例平面（空白）|Open blank sample plan
加载示例平面（已标注）|Open annotated sample plan
打开 Eichler 住宅示例|Open Eichler house sample
当前图纸识别|Plan recognition
识别当前平面|Recognize this plan
关闭识别预览|Close recognition preview
✨ 导入 AI 识别结果（JSON）|✨ Import AI annotations (JSON)
⌖ 选中房间吸附到墙线|⌖ Snap selected room to walls
⌖ 全部房间吸附到墙线|⌖ Snap all rooms to walls
魔棒参数（工具 W）|Magic wand settings (W)
墙线阈值|Wall threshold
门洞封闭|Close gaps
忽略细线（家具、铺装）|Ignore thin lines (furniture, paving)
显示墙线识别结果|Show detected walls
工具|Tools
↶ 撤销|↶ Undo
↷ 重做|↷ Redo
空间类型|Room types
（数字键切换）|(number keys)
比例尺|Scale
线段实际长度|Actual length
未设置：导出时按 1 px = 0.01 m|Scale unset. Exports use 1 px = 0.01 m.
门洞匹配容差|Door matching tolerance
px · 约为墙厚的一半多一点|px · just over half the wall thickness
显示|Display
在平面上显示关系图 (G)|Overlay graph on plan (G)
显示底图|Show plan image
导出|Export
导出空间关系 JSON|Export spatial graph JSON
保存工程（含图片）|Save project with image
• 依次点两个节点 →|• Click two nodes in order to
连接 / 断开|connect / disconnect them
• 点连线 → 选中，改门/开口或删除|• Click a link to change its type or delete it.
红色虚线|Dashed red
= 删掉的原有连接，点一下恢复|= removed link. Click to restore.
绿色|Green
= 新增的必需直连|= new required direct connection.
• 拖动节点 = 告诉生成器它大致在哪|• Drag a node to suggest its location.
• 🔒 锁定的空间保持原形状不动|• 🔒 Locked rooms keep their position and shape.
添加空间|Add a room
＋ 添加新空间|＋ Add room
编辑|Edit
↺ 重置|↺ Reset
生成|Generate
方案数|Options
搜索强度|Search effort
快速|Quick
普通|Standard
精细|Thorough
▶ 生成平面方案|▶ Generate layouts
新增或改类型的连接必须有足够长的共墙和实际门洞。保留锁定空间，重新分隔其余房间，排除阶梯墙和内角 ≤ 60° 的方案。|New and modified connections require a shared wall long enough for an opening. The generator keeps locked rooms in place and repartitions the others. It rejects stepped walls and interior angles of 60° or less.
🗑 删除|🗑 Delete
⇄ 改为开口|⇄ Make opening
⇄ 改为门|⇄ Make door
⌖ 吸附墙线|⌖ Snap to walls
取消选择 (Esc)|Deselect (Esc)
上传一张平面图开始，或在左侧加载示例|Upload a floor plan or open a sample on the left.
上传后自动读取本图的空间名称和候选轮廓|Uploading starts a scan for room labels and possible outlines.
关系图编辑|Graph editor
生成结果|Generated layouts
叠加关系图|Overlay graph
在左侧编辑关系图，然后点「▶ 生成平面方案」|Edit the graph, then click “Generate layouts”.
层级图 · 以室外为根|Depth graph · rooted at exterior
空间列表|Rooms
门与开口|Doors and openings
选中内容|Selection
改动摘要|Changes
空间 · 目标面积 · 锁定|Rooms · target area · lock
你也可以复制下方 JSON 并保存为 .json 文件。|You can also copy the JSON below and save it as a .json file.
复制|Copy
关闭|Close
✨ 导入 AI 识别结果|✨ Import AI annotations
① 复制下面的提示词，连同平面图一起发给支持看图的大模型（Amplify、ChatGPT、Claude 等）。② 把它返回的 JSON 粘贴到下方，点「生成色块」。生成的色块都可以编辑，建议再点一次「全部房间吸附到墙线」。|① Send the prompt and your plan image to a vision-capable model. ② Paste its JSON below and click “Create annotations”. You can edit the outlines and snap them to the walls.
复制提示词|Copy prompt
生成色块|Create annotations
替换现有标注|Replace existing annotations
入口|Entrance
客厅|Living room
餐厅|Dining room
厨房|Kitchen
卧室|Bedroom
卫生间|Bathroom
走廊|Hallway
书房|Study
储藏|Storage
阳台/露台|Balcony / terrace
庭院|Courtyard
车库|Garage
其他|Other
室外|Exterior
选择 / 平移|Select / pan
魔棒：点击自动识别房间|Magic wand · pick a room
画房间|Draw room
门|Door
开口|Opening
常开开口|Open passage
点击选中空间或门 → 浮动按钮删除 / 吸附墙线 · 拖动顶点改形状 · 拖空白处平移 · 滚轮缩放 · Ctrl+Z 撤销|Click a room or door for actions. Drag a vertex to reshape, drag empty space to pan, and scroll to zoom. Ctrl+Z to undo.
先选空间类型，再在房间内部空白处点一下，自动沿墙线生成色块。漏到外面时调大「门洞封闭」；墙没识别出来时调大「墙线阈值」（可勾选「显示墙线识别结果」检查）|Choose a room type and click an empty spot inside the room. Increase “Close gaps” if the fill leaks. Raise “Wall threshold” if walls are missing. Use “Show detected walls” to inspect.
沿房间内轮廓逐点点击 · 点回起点 / 双击 / Enter 闭合 · Shift 正交 · 右键撤销上一点 · 右键点已有对象可选中删除|Click along the inside edge. Click the first point, double-click the last point, or press Enter to close. Hold Shift for right angles. Right-click to undo a point or select an existing object.
在门洞处沿墙方向点两下 · 右键点已有的门可选中并删除 · 门只接触一个房间时视为通往室外|Click both ends of the doorway along the wall. Right-click a door to select or delete it. A door touching just one room leads outside.
常开开口（没有门扇，或开放式空间之间的分界）：沿分界点两下|Click both ends of an open passage or the boundary between open-plan spaces.
点击一段已知长度的两个端点（如一道 900 mm 的门），再在左侧填写实际长度|Click both ends of a known distance, such as a 900 mm door, then enter its real length in the sidebar.
图片像素还没读取完成，或这张图无法读取像素|The image pixels are still loading or could not be read.
点击处附近都是墙线：请点在房间内部的空白处，或调小「门洞封闭」|This point is surrounded by wall pixels. Click an empty spot inside the room or reduce “Close gaps”.
识别范围漏到了房间外面（门洞或玻璃墙没有闭合）。试着调大「门洞封闭」，或改用「画房间」手动描。|The fill escaped through a gap. Increase “Close gaps” or trace the room with “Draw room”.
识别到的区域太小，可能点在了文字或家具里，换个位置试试|This region is too small. Try an empty spot away from text and furniture.
轮廓提取失败|Could not extract an outline.
还没有通往室外的门：层级图暂以入口或第一个房间为根|No door leads outside. The depth graph starts at the entrance or the first room.
🗑 删除门|🗑 Delete door
🗑 删除开口|🗑 Delete opening
个节点 ·|nodes ·
条连接 ·|links ·
个环路（可绕行）· 最大深度|cycles (alternative routes) · maximum depth
个环路（树状）· 最大深度|cycles (tree) · maximum depth
标注房间和门后，这里会实时生成层级图|Add rooms and doors to see the depth graph.
删除|Delete
还没有空间|No rooms yet
未连接|Unconnected
还没有门|No doors yet
未连通|Unreachable
先选中一个房间|Select a room first.
图片像素不可用|Image pixels are unavailable.
附近没有找到明显的墙线，边界保持不变|No clear wall lines were found nearby.
没有可吸附的房间或图片|Open a plan and annotate a room before snapping.
请先上传平面图|Upload a plan image first.
提示词已复制|Prompt copied.
没有找到 JSON|No JSON found.
正在读取图中文字和墙线…|Reading labels and wall lines…
未找到可新增的独立轮廓。|No additional independent outlines found.
未找到可靠的名称或封闭轮廓。可调整墙线阈值和门洞封闭后重试，或点魔棒、手动描边。|No reliable labels or closed outlines found. Adjust the wall threshold and gap settings, use the wand, or trace a room by hand.
描边|Trace
已加入手绘轮廓。|Hand-traced outline added.
请先标注建筑外轮廓内的空间|Annotate rooms inside the building footprint first.
锁定空间含锯齿、相交边或不大于 60° 的内角，请先修正或解锁|A locked room contains stepped walls, intersecting edges, or an angle of 60° or less. Edit or unlock it.
斜边底图有相交墙、阶梯墙或不大于 60° 的内角，请修正源轮廓|The angled plan has intersecting or stepped walls, or an angle of 60° or less. Edit the source outlines.
斜边房间的轮廓重叠，请先对齐共墙|Angled rooms overlap. Align their shared walls.
标注顶点过密，请先合并共线顶点|Too many outline vertices. Merge collinear points first.
锁定空间有重叠，请核对轮廓|Locked rooms overlap. Check their outlines.
没有可撤销的关系图编辑|No graph edits to undo.
被移除的空间不能连接|Restore the removed room before connecting it.
已删除的原有连接：点击恢复|Removed original link. Click to restore.
（已移除）| (removed)
依次点两个节点 = 连接/断开 · 拖动节点 = 位置意向 · 点连线 = 选中 · 滚轮缩放|Click two nodes to connect or disconnect them. Drag a node to suggest a location. Click a link to select it. Scroll to zoom.
点击节点或连线查看属性。依次点两个节点可连接/断开。|Click a node or link to inspect it. Click two nodes in order to connect or disconnect them.
⊕ 室外|⊕ Exterior
连到「室外」的空间，生成时必须贴着建筑外轮廓并开门。|Rooms connected to the exterior need an opening on the building perimeter.
目标面积|Target area
未设比例尺：按 1 px = 1 cm 估算|Scale unset. Areas assume 1 px = 1 cm.
🔒 锁定（保持原位置和形状）|🔒 Lock position and shape
🗑 删除这个新空间|🗑 Delete this new room
↺ 恢复这个空间|↺ Restore this room
✕ 从方案中移除这个空间|✕ Remove from layout
新增的连接|New connection
原有连接（类型已改）|Original connection (type changed)
原有连接|Original connection
类型|Type
🗑 删除这条连接|🗑 Delete connection
还没有改动。直接生成会得到关系相同、几何不同的方案。|No edits yet. Generate to explore different layouts with the same connections.
锁定|Lock
新空间已放在中间：拖到想要的位置，再点另一个节点把它连起来|New room added at the center. Drag it into position, then click another node to connect it.
已重置为当前平面的关系图|Graph reset to the current plan.
· 关系满足|· connections satisfied
✓ 从生成的平面重新提取关系图，与你编辑后的关系图一致|✓ The graph extracted from this layout matches the edited graph.
可以试试：解锁相关空间、把节点拖近一点、调整目标面积，或用「精细」重新生成。|Try unlocking rooms, moving nodes closer, changing target areas, or using a thorough search.
✔ 采用此方案（回到标注继续改）|✔ Adopt and edit this layout
↗ 导出此方案 JSON|↗ Export layout JSON
· 关系|· links
请先在「① 标注平面」里标出房间和门|Add rooms and doors in “① Annotate plan” first.
标注有变化，关系图已按当前平面重新提取|Annotations changed. The graph has been rebuilt from the current plan.
无法读取图片，请选用 PNG、JPEG 或保存的工程文件。|Could not read the image. Choose a PNG, JPEG, or saved project.
读取文件失败，请重新选取|Could not read this file. Please select it again.
这个 JSON 不是保存的工程；AI 识别 JSON 请用「导入 AI 识别结果」。|This JSON is not a saved project. Use “Import AI annotations” for recognition results.
打开独立 Eichler 示例会切换当前工程。继续吗？|Switch from the current project to the Eichler sample?
示例平面（虚构）· 比例 60 px = 1 m|Sample plan · 60 px = 1 m
`.trim().split('\n').map(line => line.split('|')));

const messagePatterns = [
  [/^连续矩形区 (\d+)%$/, 'Contiguous rectangular area $1%'],
  [/^参考床位 ([\d.]+) × 2.00 m$/, 'Bed footprint $1 × 2.00 m'],
  [/^卧室缺少规整的连续空间，或床位会挡住门口。请核对比例尺、卧室面积和直连门的位置。$/, 'No usable bedroom body or bed position clear of the doors was found. Check the scale, bedroom area and required door locations.'],
  [/^卧室缺少规整的连续空间。请调整卧室目标面积、节点位置或相邻锁定房间。$/, 'No sufficiently regular bedroom body was found. Adjust the bedroom target area, node position or adjacent locked rooms.'],

  [/^已在生成副本中接合 (\d+) 处窄墙缝。$/, 'Joined $1 narrow wall-face gap(s) in the generation copy.'],
  [/^搜索 (\d+) 个分区后仍无方案。 ([\s\S]+) 本轮门宽 ([\d.]+) px。$/,(_,count,reason,width)=>'No layout after '+count+' partition trials. '+translateMessage(reason)+' Door width in this search: '+width+' px.'],
  [/^通过几何检查的分区不足以继续分配房间。请检查窄缝、锯齿或锁定的边界。$/, 'No usable partition remained. Check narrow gaps, stepped walls and locked boundaries.'],
  [/^主要阻点是房间通行：已匹配的门仍把需要通行的房间分隔开。请检查独立房间的出入口。$/, 'The main obstacle was circulation. The matched openings left required rooms disconnected. Check entrances to detached spaces.'],
  [/^主要阻点是布局变化不足。请调整节点位置或解锁可移动的房间。$/, 'The main obstacle was insufficient layout change. Adjust node positions or unlock movable rooms.'],
  [/^开口两侧的几何核对未通过。请检查图上墙线和门洞位置。$/, 'Opening verification failed. Check wall outlines and doorway positions.'],
  [/^主要阻点是门宽与可用共墙。需同时满足的直连为 ([\s\S]+)。请核对比例尺、标注的门宽和共墙。$/,(_,links)=>'Door width and available shared walls limited the search. Required direct links: '+links+'. Check the scale, marked door widths and shared walls.'],
  [/^主要阻点是可用共墙和室外出口。请核对比例尺及独立房间的出入口。$/, 'Shared walls and exterior access limited the search. Check the scale and entrances to detached rooms.'],

  [/^正在生成平面方案…$/, 'Generating layouts…'],
  [/^已在生成时校正 (\d+) 个房间的轻微描边偏差。$/, 'Minor tracing offsets corrected for generation in $1 room(s).'],
  [/^请检查「([\s\S]*)」：(轮廓退化或顶点重复|含有不大于 60° 的内角|含有连续的阶梯墙|存在交叉或自接触的边)。$/, (_,name,reason) => 'Check “'+name+'”. '+({'轮廓退化或顶点重复':'The outline has zero area or repeated vertices.', '含有不大于 60° 的内角':'An interior angle is 60° or less.', '含有连续的阶梯墙':'The outline contains a stepped wall.', '存在交叉或自接触的边':'The outline has crossing or self-touching edges.'}[reason])],
  [/^请对齐「([\s\S]*)」和「([\s\S]*)」的共墙：两个轮廓重叠。$/, 'Align the shared wall between “$1” and “$2”. Their outlines overlap.'],
  [/^🗑 删除「([\s\S]*)」$/, '🗑 Delete “$1”'],
  [/^已生成「([\s\S]*)」：(\d+) 个顶点。可拖动顶点修正，或在列表里改名$/, 'Created “$1” with $2 vertices. Drag vertices to edit, or rename it in the list.'],
  [/^一处(门|开口)没有接触任何房间（可调大容差、移动或删除它）$/, (_, kind) => 'A' + (kind === '门' ? ' door' : 'n opening') + ' touches no room. Increase the tolerance, move it, or delete it.'],
  [/^一处(门|开口)同时接触 (\d+) 个房间，已取最近的两个$/, (_, kind, n) => 'A' + (kind === '门' ? ' door' : 'n opening') + ' touches ' + n + ' rooms. The two nearest were used.'],
  [/^(\d+) 个空间无法从(室外|根节点)到达：检查是否漏画了门$/, (_, n, root) => n + ' room(s) unreachable from the ' + (root === '室外' ? 'exterior' : 'root') + '. Check for missing doors.'],
  [/^深度 (\S+) · 连接 (\S+) · 整合度 (.*)$/, 'Depth $1 · links $2 · integration $3'],
  [/^门 (\d+)$/, 'Door $1'], [/^开口 (\d+)$/, 'Opening $1'], [/^深度 (\d+)$/, 'Depth $1'],
  [/^已吸附 (\d+) 条边$/, 'Edges snapped: $1'],
  [/^共吸附 (\d+) 条边（只移动靠近明显墙线的边，开放空间的分界不动）$/, 'Edges snapped: $1. Only edges near detected walls moved.'],
  [/^1 px = ([\d.]+) m · 图幅约 (.+) m$/, '1 px = $1 m · plan size ≈ $2 m'],
  [/^已生成 (\d+) 个空间色块、(\d+) 处门\/开口，全部可编辑$/, 'Created $1 editable room outlines and $2 doors / openings.'],
  [/^JSON 解析失败：([\s\S]+)$/, (_, detail) => 'Could not parse JSON. ' + translateMessage(detail)],
  [/^(?:读到 (\d+) 组英文名称。)?(\d+) 个候选轮廓(?:，(\d+) 处仅定位到文字)?。$/, (_, labels, outlines, pins) => (labels ? 'English labels: ' + labels + '. ' : '') + 'Candidate outlines: ' + outlines + '.' + (pins ? ' Labels without outlines: ' + pins + '.' : '')],
  [/^识别中止：([\s\S]+)$/, 'Recognition stopped. $1'],
  [/^采用选中的 (\d+) 个轮廓$/, 'Use selected outlines ($1)'],
  [/^正在描「([\s\S]*)」。沿实际边界逐点点击，按 Enter 闭合。$/, 'Tracing “$1”. Click along the boundary and press Enter to close.'],
  [/^已加入 (\d+) 个候选轮廓，可拖动顶点修正。门和开口请沿图纸标注。$/, 'Added $1 candidate outlines. Drag vertices to adjust, then mark doors and openings on the plan.'],
  [/^已断开：([\s\S]+)$/, 'Disconnected: $1'], [/^已连接：([\s\S]+)$/, 'Connected: $1'], [/^已恢复：([\s\S]+)$/, 'Restored: $1'],
  [/^已选「([\s\S]*)」→ 再点另一个节点：连接或断开（Esc 取消）$/, 'Selected “$1”. Click another node to connect or disconnect. Esc cancels.'],
  [/^＋ (\d+) 条新连接$/, '＋ New links: $1'], [/^− (\d+) 条连接被删除$/, '− Removed links: $1'],
  [/^⇄ (\d+) 条改了门\/开口类型$/, '⇄ Changed link types: $1'], [/^＋ (\d+) 个新空间$/, '＋ New rooms: $1'],
  [/^− (\d+) 个空间被移除$/, '− Removed rooms: $1'], [/^共 (\d+) 条连接 · 🔒 锁定 (\d+) 个空间$/, '$1 links · 🔒 $2 locked rooms'],
  [/^正在比较布局 (\d+) \/ (\d+)$/, 'Comparing layouts $1 / $2'],
  [/^生成中止：([\s\S]+)$/, (_, reason) => 'Generation stopped. ' + translateMessage(reason)],
  [/^已生成 (\d+) \/ (\d+) 个不同布局 · ([\d.]+) 秒$/, 'Generated $1 / $2 distinct layouts in $3 s'],
  [/^本轮未找到符合几何和连接要求的布局。(?:必需直连：([\s\S]+)。)?可调整锁定空间或提高搜索强度。$/, (_, links) => 'No layout met the geometry and connection requirements.' + (links ? ' Required direct links: ' + links + '.' : '') + ' Adjust locked rooms or increase the search effort.'],
  [/^方案 (\S+)$/, 'Option $1'], [/^· 平均面积偏差 (\d+)%$/, '· mean area error $1%'],
  [/^· 重排 (\d+)\/(\d+) 个可移动的原有空间$/, '· repositioned $1/$2 existing unlocked rooms'],
  [/^✓ ([\s\S]+) · 已核对共墙和直通门洞$/, '✓ $1 · shared wall and direct opening verified'],
  [/^✗ ([\s\S]+)：没有形成共用墙和门$/, '✗ $1 · no shared wall and opening'],
  [/^＋ 多出的连接：([\s\S]+)$/, '＋ Additional link: $1'], [/^· 面积 ±(\d+)%$/, '· area ±$1%'],
  [/^已采用方案 (\S+)：底图已隐藏（左侧「显示底图」可打开），可以继续修改，或再次进入 ② 编辑关系$/, 'Adopted option $1. The plan image is hidden. Use “Show plan image” to view it, or continue editing.']
];

function translateMessage(source) {
  const literal = englishCopy.get(source);
  if (literal !== undefined) return literal;
  if (source.startsWith('⚠ ')) return '⚠ ' + translateMessage(source.slice(2));
  for (const [pattern, replacement] of messagePatterns) {
    if (pattern.test(source)) return source.replace(pattern, replacement);
  }
  return source;
}

const languagePreferenceKey = 'designing-relationships.language';
let uiLanguage = 'zh';
try {
  let preference = localStorage.getItem(languagePreferenceKey);
  if (preference === null) {
    preference = localStorage.getItem('plan2graph.language');
    if (preference === 'zh' || preference === 'en') localStorage.setItem(languagePreferenceKey, preference);
  }
  if (preference === 'en') uiLanguage = 'en';
} catch {}
const ui = source => uiLanguage === 'en' ? translateMessage(source) : source;
const englishPrompt = `Read only the uploaded floor plan. Match numbered spaces to the legend and follow leader lines to their endpoints. Identify rooms by their printed labels. Return only valid JSON in this format:
{"image_size":[width,height],"rooms":[{"name":"label on drawing","type":"bedroom","polygon":[[x,y],[x,y],[x,y]]}],"connections":[{"kind":"door","a":[x,y],"b":[x,y]}]}
1. Use image pixels with the origin at the top left, x increasing rightward and y downward.
2. Trace the inside wall face clockwise. Use horizontal or vertical segments where they match the drawing.
3. Allowed types: entrance, living, dining, kitchen, bedroom, bathroom, corridor, study, storage, balcony, courtyard, garage, other.
4. Where open-plan rooms meet, use labels and furniture to locate the boundary and connect them with kind "opening".
5. Set a and b at the two ends of the door or opening along the wall. An exterior door may touch just one room.
6. Include clearly identifiable unlabeled spaces such as corridors or foyers and give them descriptive names.
7. Omit uncertain outlines or openings for manual review.`;

function installLanguageSwitch() {
  const originals = new WeakMap();
  const button = document.getElementById('language');
  const excluded = 'script,style,textarea,input,code,[data-project-text],#language,#cv,#gprev,#gthumbs svg';

  function localizeText(node) {
    const previous = originals.get(node);
    const source = previous && node.data === previous.rendered ? previous.source : node.data;
    if (!/[\u3400-\u9fff）]/u.test(source)) return;
    const rendered = uiLanguage === 'zh' ? source : source.replace(/^(\s*)([\s\S]*?)(\s*)$/u,
      (_, left, copy, right) => left + translateMessage(copy) + right);
    if (rendered !== source || previous) originals.set(node, {source, rendered});
    if (node.data !== rendered) node.data = rendered;
  }

  function localizeTree(node) {
    if (node.nodeType === Node.TEXT_NODE) { localizeText(node); return; }
    if (node.nodeType !== Node.ELEMENT_NODE || node.matches(excluded)) return;
    if (node.hasAttribute('title')) {
      const source = node.dataset.uiTitle || node.getAttribute('title');
      if (englishCopy.has(source)) { node.dataset.uiTitle = source; node.setAttribute('title', ui(source)); }
    }
    for (const child of node.childNodes) localizeTree(child);
  }

  function refresh() {
    document.documentElement.lang = uiLanguage === 'en' ? 'en' : 'zh-CN';
    document.title = ui('Designing Relationships · 平面识别与关系编辑');
    button.textContent = uiLanguage === 'en' ? '中文' : 'English';
    button.lang = uiLanguage === 'en' ? 'zh-CN' : 'en';
    button.setAttribute('aria-label', uiLanguage === 'en' ? '切换为中文' : 'Switch to English');
    document.getElementById('aiprompt').value = uiLanguage === 'en' ? englishPrompt : AI_PROMPT;
    localizeTree(document.body);
    if (!document.getElementById('bar').hidden) placeBar();
  }

  // Dynamic panels write fresh Chinese UI strings. Translate only newly rendered UI.
  // Drawing layers use geometric hit testing and never need this pass.
  const updates = new MutationObserver(records => {
    if (uiLanguage !== 'en') return;
    for (const record of records) {
      if (!record.addedNodes.length || record.target.closest(excluded)) continue;
      for (const node of record.addedNodes) localizeTree(node);
    }
  });
  updates.observe(document.body, {childList:true, subtree:true});
  button.addEventListener('click', event => {
    uiLanguage = uiLanguage === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem(languagePreferenceKey, uiLanguage); } catch {}
    refresh();
    if (event.detail && TAB === 1 && (draft.length || doorA || scaleA) &&
        document.querySelectorAll('.modal:not([hidden])').length === 0) {
      svg.focus({preventScroll:true});
    }
  });
  refresh();
}
