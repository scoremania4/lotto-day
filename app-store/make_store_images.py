# 앱스토어 홍보 이미지 제작: 원본 화면 + 제목/설명 (1206x2622)
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SRC = "screenshots-6.9inch"; OUT = "store-6.3inch"
W, H = 1206, 2622
PAPER, DEEP, INK, INK2, ACC = "#EFE7D8", "#E7DDCB", "#2B2926", "#57514A", "#D2553A"
TTC = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
def font(size, weight):
    f = ImageFont.truetype(TTC, size)
    f.set_variation_by_name(weight) if False else None
    return f
def pick(size, style):
    for i in range(12):
        try:
            f = ImageFont.truetype(TTC, size, index=i)
            if f.getname()[1] == style: return f
        except Exception: pass
    return ImageFont.truetype(TTC, size)
ITEMS = [
 ("1-홈", "토요일 저녁의 작은 설렘", ["추첨까지 남은 시간,", "한눈에 확인해요"], ["다음 추첨 카운트다운과 지난주 당첨 번호를", "홈 화면에서 바로 볼 수 있어요"]),
 ("2-패턴표", "밑그림 겹쳐보기", ["지난 번호를 겹쳐", "흐름을 읽어요"], ["최근 1~3회 당첨 번호를", "파랑·초록·보라로 겹쳐 보여드려요"]),
 ("3-이월수", "이월수 연결도", ["이월수를 선으로", "이어서 봐요"], ["지난 회차에서 다시 나온 번호를 연결하고", "몇 회째 이어졌는지 알려드려요"]),
 ("4-번호고르기", "번호 고르기", ["패턴 위에서 바로", "번호를 골라요"], ["홀짝·작은 수와 큰 수 비율을 보며 고르고", "마음에 들면 보관함에 담아 두세요"]),
 ("5-명당", "명당 찾기", ["이번 회차 1·2등", "판매점과 당첨금"], ["지역별로 모아 보고", "내 위치에서 가까운 순으로 정렬해요"]),
]
eb, hd, sb = (ImageFont.truetype(TTC, 46, index=4), ImageFont.truetype(TTC, 104, index=6), ImageFont.truetype(TTC, 46, index=2))
for name, eyebrow, head, sub in ITEMS:
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    # 주홍 알약 라벨
    tw = d.textlength(eyebrow, font=eb); px = 76
    d.rounded_rectangle((px, 120, px+tw+64, 120+84), 42, fill=ACC)
    d.text((px+32, 162), eyebrow, font=eb, fill="#FFF7F0", anchor="lm")
    y = 250
    for l in head: d.text((px, y), l, font=hd, fill=INK); y += 128
    y += 14
    for l in sub: d.text((px, y), l, font=sb, fill=INK2); y += 66
    # 화면 카드(둥근 모서리 + 그림자)
    s = Image.open(f"{SRC}/{name}.png").convert("RGB")
    w = 830; h = round(w*s.height/s.width); s = s.resize((w, h), Image.LANCZOS)
    x0, y0 = (W-w)//2, H-h-27
    mask = Image.new("L", (w*2, h*2), 0); ImageDraw.Draw(mask).rounded_rectangle((0,0,w*2-1,h*2-1), 140, fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    sh = Image.new("RGBA", (W, H), (0,0,0,0)); shm = Image.new("L", (W, H), 0)
    shm.paste(mask.point(lambda v: int(v*0.30)), (x0, y0+22)); shm = shm.filter(ImageFilter.GaussianBlur(28))
    im.paste(Image.new("RGB", (W, H), "#3a2f22"), (0,0), shm)
    ring = Image.new("L", (w+12, h+12), 0); ImageDraw.Draw(ring).rounded_rectangle((0,0,w+11,h+11), 146, fill=255)
    im.paste(Image.new("RGB", ring.size, INK), (x0-6, y0-6), ring)
    im.paste(s, (x0, y0), mask)
    im.save(f"{OUT}/{name}.png", optimize=True)
print("ok")
