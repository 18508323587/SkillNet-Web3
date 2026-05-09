import sqlite3
import math
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

DB_FILE = "skillnet.db"
app = FastAPI()

# --- 跨域配置 (保持不变) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. 增强版数据模型 (增加喜好字段)
# ==========================================

class UserProfile(BaseModel):
    # 全部加上 default！彻底消灭 422 报错
    wallet_address: str = Field(default="0x默认测试地址", alias="userAddress")
    combo_days: int = Field(default=0, alias="streakDays")
    staked_points: int = Field(default=0, alias="totalPoints")
    
    history_accuracy: float = Field(default=0.8, alias="historyAccuracy")
    history_course_ids: List[int] = Field(default=[], alias="historyCourseIds")
    prefer_video: bool = Field(default=False, alias="preferVideo")
    is_hardcore: bool = Field(default=False, alias="isHardcore")

    class Config:
        populate_by_name = True 
        # 把原本那行旧的删掉，换成这行最新的 V2 写法：
        validate_by_name = True

class Course(BaseModel):
    id: int
    title: str
    base_points: int
    difficulty: float
    type: str
    tags: str
    # 👇 就是缺了这一行！告诉 Python 这个字段是合法的，不要丢掉它！
    video_url: Optional[str] = None

# ==========================================
# 2. 数据库操作：支持喜好标签
# ==========================================
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # 删除旧表，重新创建以确保结构干净
    cursor.execute('DROP TABLE IF EXISTS courses') 
    cursor.execute('''
        CREATE TABLE courses (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            base_points INTEGER NOT NULL,
            difficulty REAL NOT NULL,
            type TEXT NOT NULL,
            tags TEXT NOT NULL,
            video_url TEXT NOT NULL
        )
    ''')
    
    # 🔥 50门全品类硬核课程库矩阵
    courses_data = [
        # --- Web3 区块链 (8门) ---
        (1, "Web3 通识课：区块链的本质", 100, 0.1, "video", "Web3,基础", "https://www.bilibili.com/video/BV1bo4y1q7tp/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (2, "Solidity 智能合约开发实战", 500, 0.4, "video", "Web3,开发", "https://www.bilibili.com/video/BV1S5pqeBEfp/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (3, "DeFi 闪电贷原理", 800, 0.7, "video", "Web3,金融", "https://www.bilibili.com/video/BV1FS4y1q7wy/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (4, "NFT 铸造与 ERC-721 源码", 400, 0.3, "video", "Web3,开发", "https://www.bilibili.com/video/BV1reL1zDELH/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (5, "零知识证明(ZKP)", 1500, 0.9, "video", "Web3,密码学", "https://www.bilibili.com/video/BV1uymuBcEed/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (6, "Layer2 扩容方案：Rollup 详解", 700, 0.6, "video", "Web3,架构", "https://www.bilibili.com/video/BV1ZG411C71J/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (7, "Web3 代币经济学", 600, 0.5, "video", "Web3,投资", "https://www.bilibili.com/video/BV1jKYszwExJ/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (8, "智能合约安全审计", 1200, 0.8, "video", "Web3,安全", "https://www.bilibili.com/video/BV1ga411R7AK/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 前端开发 (5门) ---
        (9, "HTML5 + CSS3 零基础建站", 150, 0.1, "video", "前端,基础", "https://www.bilibili.com/video/BV1p84y1P7Z5/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (10, "JavaScript 核心原理", 400, 0.4, "video", "前端,进阶", "https://www.bilibili.com/video/BV1YD4y1g7F6/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (11, "React 18 全家桶", 600, 0.5, "video", "前端,框架", "https://www.bilibili.com/video/BV1XD4y1M7DG/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (12, "Vue3 + TypeScript 后台管理系统", 650, 0.5, "video", "前端,实战", "https://www.bilibili.com/video/BV1Za4y1r7KE/?spm_id_from=333.337.search-card.all.click"),
        (13, "前端性能优化", 900, 0.7, "video", "前端,架构", "https://www.bilibili.com/video/BV1K1yEB6ENY/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 后端开发 (5门) ---
        (14, "Python 编程与自动化脚本", 200, 0.2, "video", "后端,基础", "https://www.bilibili.com/video/BV1fpoyBeERa/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (15, "Java SpringBoot 微服务架构", 800, 0.6, "video", "后端,企业级", "https://www.bilibili.com/video/BV1oXAEz6ECP/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (16, "Go 语言高并发服务器开发", 900, 0.7, "video", "后端,高并发", "https://www.bilibili.com/video/BV17K41167aa/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (17, "MySQL 数据库底层索引优化", 700, 0.6, "video", "后端,数据库", "https://www.bilibili.com/video/BV1LU411Z74r/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (18, "云原生部署", 1000, 0.8, "video", "后端,运维", "https://www.bilibili.com/video/BV13Q4y1C7hS/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 人工智能 (6门) ---
        (19, "Midjourney 软件基础", 250, 0.2, "video", "人工智能,设计", "https://www.bilibili.com/video/BV1CmMHzuE3u/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (20, "Prompt Engineering 提示词工程", 300, 0.2, "video", "人工智能,应用", "https://www.bilibili.com/video/BV1n9CwYoEro/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (21, "机器学习基础：回归与分类", 700, 0.6, "video", "人工智能,算法", "https://www.bilibili.com/video/BV1BoNvzfELN/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (22, "PyTorch 深度学习", 900, 0.7, "video", "人工智能,开发", "https://www.bilibili.com/video/BV1hE411t7RN/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (23, "Transformer 原理", 1300, 0.8, "video", "人工智能,前沿", "https://www.bilibili.com/video/BV1fj6vBfEnu/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (24, "计算机视觉(CV)与目标检测", 1000, 0.7, "video", "人工智能,CV", "https://www.bilibili.com/video/BV1v2RLBBEHy/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 金融学 (4门) ---
        (25, "宏观经济学", 400, 0.4, "video", "金融,理论", "https://www.bilibili.com/video/BV1nP411t7fu/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (26, "公司理财与财务报表分析", 500, 0.5, "video", "金融,实务", "https://www.bilibili.com/video/BV1214y1X7NK/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (27, "期权期货与衍生品定价", 1100, 0.8, "video", "金融,量化", "https://www.bilibili.com/video/BV1Rx411r7nW/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (28, "量化交易策略与 Python 实现", 950, 0.7, "video", "金融,技术", "https://www.bilibili.com/video/BV1GJ411b7aq/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 法学 (4门) ---
        (29, "民法典核心条文解读", 300, 0.3, "video", "法律,基础", "https://www.bilibili.com/video/BV15Y4y1u7qj/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (30, "刑法分则与常见罪名解析", 450, 0.4, "video", "法律,进阶", "https://www.bilibili.com/video/BV1K5kdBzEWi/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (31, "知识产权法与专利申请", 550, 0.5, "video", "法律,商业", "https://www.bilibili.com/video/BV1LP4y1F7g6/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (32, "Web3 与数据合规全球法案", 850, 0.7, "video", "法律,前沿", "https://www.bilibili.com/video/BV1WRgKzKEa9/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 英语 (4门) ---
        (33, "职场商务英语口语速成", 200, 0.2, "video", "英语,职场", "https://www.bilibili.com/video/BV1vCySBVEm2/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (34, "雅思 IELTS 阅读8分技巧", 500, 0.5, "video", "英语,考试", "https://www.bilibili.com/video/BV1A84y1t7cf/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (35, "托福 TOEFL 听力满分训练", 550, 0.5, "video", "英语,考试", "https://www.bilibili.com/video/BV1h8BdY5EKz/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (36, "计算机专业英语文献阅读", 400, 0.4, "video", "英语,学术", "https://www.bilibili.com/video/BV1PwhEzXEjC/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 设计学 (4门) ---
        (37, "Figma UI/UX 界面设计规范", 300, 0.3, "video", "设计,UI", "https://www.bilibili.com/video/BV1QzADeFEcF/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (38, "Adobe Premiere 影视剪辑实战", 350, 0.3, "video", "设计,视频", "https://www.bilibili.com/video/BV1K64y1r7pp/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (39, "Blender 3D 建模与渲染", 600, 0.5, "video", "设计,3D", "https://www.bilibili.com/video/BV1ox9dBnEGb/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (40, "色彩心理学", 450, 0.4, "video", "设计,理论", "https://www.bilibili.com/video/BV1dP4y1o7oS/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 考研 (4门) ---
        (41, "考研政治：史纲与马原串讲", 400, 0.4, "video", "考研,政治", "https://www.bilibili.com/video/BV1CE411o7x3/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (42, "考研英语一：长难句语法剖析", 450, 0.5, "video", "考研,英语", "https://www.bilibili.com/video/BV1sr97BoEvr/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (43, "考研数学一：高数极限与微积分", 700, 0.6, "video", "考研,数学", "https://www.bilibili.com/video/BV1CAxaeHEeH/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (44, "考研数据结构(408)真题解析", 800, 0.7, "video", "考研,专业课", "https://www.bilibili.com/cheese/play/ss267629955?query_from=0&search_id=756075773555031098&search_query=%E8%80%83%E7%A0%94%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%EF%BC%88408%EF%BC%89%E7%9C%9F%E9%A2%98%E8%A7%A3%E6%9E%90&csource=common_hpsearch_null_null&spm_id_from=333.337.search-card.all.click"),

        # --- 医学 (3门) ---
        (45, "系统解剖学：骨骼与肌肉", 600, 0.6, "video", "医学,基础", "https://www.bilibili.com/video/BV1yvNueBEdz/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (46, "药理学：药物作用机制全景", 800, 0.7, "video", "医学,进阶", "https://www.bilibili.com/video/BV1c3411p7iU/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),
        (47, "临床急救与心肺复苏(CPR)", 300, 0.2, "video", "医学,实务", "https://www.bilibili.com/video/BV1yLwRzmE7n/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352"),

        # --- 体育 (1门) ---
        (48, "运动康复与科学力量训练", 200, 0.2, "video", "体育,康复", "https://www.bilibili.com/video/BV1dD4y1e7dX/?spm_id_from=333.337.search-card.all.click"),

        # --- 数学 (2门) ---
        (49, "线性代数：矩阵与向量空间", 650, 0.6, "video", "数学,理论", "https://www.bilibili.com/cheese/play/ss150964055?query_from=0&search_id=17053687317481681529&search_query=%E7%BA%BF%E6%80%A7%E4%BB%A3%E6%95%B0%EF%BC%9A%E7%9F%A9%E9%98%B5%E4%B8%8E%E5%90%91%E9%87%8F%E7%A9%BA%E9%97%B4&csource=common_hpsearch_null_null&spm_id_from=333.337.search-card.all.click"),
        (50, "概率论与数理统计实战应用", 700, 0.6, "video", "数学,应用", "https://www.bilibili.com/video/BV1SC4y1m7Fo/?spm_id_from=333.337.search-card.all.click&vd_source=c8e5108bb22e9e50426c94631c666352")
    ]
    
    cursor.executemany('INSERT INTO courses VALUES (?,?,?,?,?,?,?)', courses_data)
    conn.commit()
    conn.close()
    print("🚀 数据库已升级！50门超级全品类课程已入库，包含全部视频路径。")

def get_courses_from_db() -> List[Course]:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # ⚠️ 关键修复 1：SELECT 语句最后加上了 video_url
    cursor.execute("SELECT id, title, base_points, difficulty, type, tags, video_url FROM courses")
    rows = cursor.fetchall()
    conn.close()
    
    # ⚠️ 关键修复 2：把拿到的第 7 个字段 (r[6]) 赋值给 video_url
    return [Course(
        id=r[0], 
        title=r[1], 
        base_points=r[2], 
        difficulty=r[3], 
        type=r[4], 
        tags=r[5], 
        video_url=r[6]  # <--- 就是缺了这一句导致崩溃的！
    ) for r in rows]


# ==========================================
# 3. AI 引擎与业务接口
# ==========================================
class SkillNetAI:
    def calculate_score(self, course: Course, user: UserProfile) -> float:
        combo_bonus = min(user.combo_days * 0.01, 0.3)
        stake_mult = 1.3 if user.staked_points >= 5000 else (1.1 if user.staked_points >= 1000 else 1.0)
        reward_score = course.base_points * (1 + course.difficulty) * (1 + combo_bonus) * stake_mult
        
        preference_score = 0
        if user.prefer_video and course.type == "video":
            preference_score += 200
        if user.is_hardcore and course.difficulty >= 0.4:
            preference_score += 300
            
        return reward_score + preference_score

    # 就是下面这个绝招刚才不见了，现在我把它带回来了！还包含了多学科过滤逻辑！
    def get_recommendations(self, user: UserProfile, all_courses: List[Course]) -> List[Course]:
        candidates = [c for c in all_courses if c.id not in user.history_course_ids]
        scored = [(c, self.calculate_score(c, user)) for c in candidates]
        scored.sort(key=lambda x: x[1], reverse=True)

        categorized_results = {}
        for item in scored:
            course = item[0]
            main_category = course.tags.split(",")[0] 
            if main_category not in categorized_results:
                categorized_results[main_category] = []
            if len(categorized_results[main_category]) < 2:
                categorized_results[main_category].append(item)

        final_scored_list = []
        for items in categorized_results.values():
            final_scored_list.extend(items)
            
        final_scored_list.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in final_scored_list[:10]] # 返回精选的10门

ai_engine = SkillNetAI()
        

# ==========================================
# 4. 业务接口
# ==========================================
@app.post("/api/recommend")
async def fetch_recommendations(user: UserProfile):
    try:
        print("====== 1. 成功接收到前端数据 ======")
        print(user.model_dump() if hasattr(user, 'model_dump') else user.dict())
        
        print("====== 2. 正在连接数据库... ======")
        db_courses = get_courses_from_db()
        print(f"成功从数据库读取了 {len(db_courses)} 门课程")
        
        print("====== 3. 正在启动 AI 引擎计算... ======")
        recommended_courses = ai_engine.get_recommendations(user, db_courses)
        print(f"AI 成功计算出 {len(recommended_courses)} 门推荐课程")
        
        print("====== 4. 正在打包数据发给前端... ======")
      # ====== 4. 正在打包数据发给前端... ======
        safe_data = []
        for c in recommended_courses:
            # 1. 难度转换：把 0.5 这种小数转成整数 5，防止对面 NestJS 数据库报错
            diff_int = int(c.difficulty * 10) if isinstance(c.difficulty, float) else int(c.difficulty)
            
            # 2. 积分强制转整数
            reward_int = int(c.base_points)
            
            # 3. 强制最少观看时间 (秒)：限制必须在页面停留满足最低时长才能解锁测验
            required_study_time = 180 

            # 🔥 完全按照对方 AI 要求的严格 JSON 格式重新捏造字典
            course_dict = {
                "id": f"course_{c.id}",           # 强行拼接成 course_123 格式
                "title": c.title,
                "difficulty": diff_int,           # 绝对的整数
                "baseReward": reward_int,         # 完美改名 + 整数
                "minStudyTime": required_study_time, # 加入强制停留时长限制
                "video_url": c.video_url,         # 这里吐出的自然是咱们库里存的 B 站链接
                "questions": [
                    {
                        "type": "choice",
                        "question": f"Q1. 关于《{c.title}》的核心知识，以下描述正确的是？",
                        "options": [
                            "A. 可以在不泄露真实数据的情况下证明自己拥有数据",
                            "B. 它降低了系统的整体安全性",
                            "C. 只能在以太坊主网上运行",
                            "D. 它需要暴露用户的私钥"
                        ],
                        "correctAnswer": "A. 可以在不泄露真实数据的情况下证明自己拥有数据"
                    },
                    {
                        "type": "boolean",
                        "question": "Q2. 【判断题】学习完本节课必须满足最低观看时长才能交卷。",
                        "options": ["对 (True)", "错 (False)"],
                        "correctAnswer": "对 (True)"
                    }
                ]
            }

            safe_data.append(course_dict)

        # 👇 注意这里的缩进！它在 for 循环的外面，但在 try 代码块的里面
        return {
            "status": "success",
            "message": "AI 推荐数据已按终极契约生成",
            "data": safe_data
        }

# 👇 except 必须和最上面的 try 在同一条竖线上！
    except Exception as e:
        print(f"🚨 推荐接口发生崩溃: {e}")
    return {"status": "error", "message": f"推荐接口报错: {str(e)}"}
    
# ==========================================
# 6. 课程详情接口 (专治前端刷新失忆)
# ==========================================
@app.get("/api/courses/{course_id}")
async def get_course_detail(course_id: int):
    print(f"🚨 前端正在请求 ID 为 {course_id} 的课程详情") # 加这一行
    conn = sqlite3.connect(DB_FILE)
    try:
        real_id = int(course_id)
        print(f"正在查询课程ID： {real_id}")
    except:
        return {"status": "error", "message":"ID 格式不对"}
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # 根据前端传来的 ID 去数据库里捞这门课的数据
    cursor.execute("SELECT id, title, base_points, difficulty, type, tags, video_url FROM courses WHERE id = ?", (course_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        # 如果数据库里真没有，才返回不存在
        return {"status": "error", "message": "课程不存在"}

    # 打包成前端最喜欢的驼峰命名格式返回
    return {
        "status": "success",
        "data": {
            "id": row[0],
            "title": row[1],
            "basePoints": row[2],
            "difficulty": row[3],
            "type": row[4],
            "tags": row[5],
            "videoUrl": row[6]  # 🔥 关键：直接给他 videoUrl
        }
    }

@app.get("/simulator", response_class=HTMLResponse)
async def serve_simulator():
    with open("simulator.html", "r", encoding="utf-8") as f:
        return f.read()

init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)