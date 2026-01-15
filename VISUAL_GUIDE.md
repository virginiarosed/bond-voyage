# Visual Guide: Responsive Profile Section

## 📱 Device Mockups

### Mobile Phone (320px - 480px)

```
┌─────────────────────────┐
│         Header          │
├─────────────────────────┤
│                         │
│     ┌───────────┐       │
│     │  Avatar   │       │  96x96px
│     │  (96px)   │       │  Centered
│     └───────────┘       │
│                         │
│    John Doe             │  Font: 18px
│   john@email.com        │  Font: 12px
│                         │
│  ✓ Owned Travel    1    │  Vertical Stats
│                         │
│  ✓ Collaborative   0    │
│                         │
│   ┌─────────────────┐   │
│   │ Adventure       │   │  Avatar component
│   │ Component       │   │  max-width: 280px
│   │                 │   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
  Padding: 12px
  Gaps: 12px
```

### Tablet (640px - 1024px)

```
┌────────────────────────────────────┐
│             Header                 │
├────────────────────────────────────┤
│                                    │
│  ┌────────────┐  Name       Date   │  Avatar: 112px - 144px
│  │   Avatar   │  john@email │       │  Left side
│  │ (112-144px)│                    │
│  │            │  Owned Travel  1   │  Horizontal stats
│  └────────────┘  Collaborative 0   │  with divider
│                                    │
│  ┌──────────────────────────────┐  │
│  │   Adventure Component        │  │  Full width
│  │   max-width: 300px - 350px   │  │
│  │                              │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
  Padding: 16px - 24px
  Gaps: 16px - 24px
```

### Desktop (1024px+)

```
┌────────────────────────────────────────────────────────────────────┐
│                          Header                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐  Name              │  ┌────────────────────┐        │
│  │ Avatar   │  john@email        │  │   Adventure        │        │
│  │ (160px)  │                    │  │   Avatar Component │        │
│  │          │  Owned Travel  │ 1 │  │   (Inline)         │        │
│  └──────────┘  Collaborative │ 0 │  │                    │        │
│                                │  │                    │        │
│  Left Padding: 32px            │  │                    │        │
│  Gap: 40px                        │  max-width: none   │        │
│                                  │                    │        │
│                                  └────────────────────┘        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
  Padding: 32px
  Gaps: 40px
  Avatar: Inline position
```

---

## 📐 Responsive Scaling Chart

### Avatar Dimensions

```
Size Progression:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile (320px)     Extra Small    Small (640px)    Medium (768px)
96x96px            112x112px      128x128px        144x144px
(w-24 h-24)        (xs:w-28)      (sm:w-32)        (md:w-36)
│                  │              │                │
├──┐               ├───┐           ├────┐           ├─────┐
│  │               │   │           │    │           │     │
│  │               │   │           │    │           │     │
├──┘               ├───┘           ├────┘           ├─────┘
│                  │              │                │
        Large (1024px)           Desktop (1280px+)
        160x160px                160x160px+
        (lg:w-40)                (xl:w-48)
        ├──────┐                 ├──────┐
        │      │                 │      │
        │      │                 │      │
        ├──────┘                 ├──────┘
        │                        │
```

### Typography Scaling

```
Heading (h1) - Name:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile    │ Extra  │ Small  │ Medium │ Large  │ Desktop
          │ Small  │        │        │        │
18px      │ 20px   │ 24px   │ 30px   │ 36px   │ 36px+
(text-lg) │(text-xl)(text-2xl)(text-3xl)(text-4xl)
          │        │        │        │        │
╔═════╗   │╔═══════╗│╔═════════╗│╔════════╗│╔══════════╗│╔══════════╗
║ John║   │║ John  ║│║  John   ║│║ John   ║│║   John   ║│║   John   ║
╚═════╝   │╚═══════╝│╚═════════╝│╚════════╝│╚══════════╝│╚══════════╝
```

### Spacing Progression

```
Padding (Container):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

12px        16px        20px        24px        32px
(p-3)       (xs:p-4)    (sm:p-5)    (md:p-6)    (lg:p-8)
┌──────┐    ┌────────┐  ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Page │    │ Page   │  │ Page     │ │ Page     │ │ Page         │
└──────┘    └────────┘  └──────────┘ └──────────┘ └──────────────┘

Gap (Between elements):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

12px        16px        24px        32px        40px
(gap-3)     (xs:gap-4)  (sm:gap-6)  (md:gap-8)  (lg:gap-10)
[El] [El]   [El]  [El]  [El]    [El] [El]      [El] [El]
```

---

## 🎨 Layout Transformation Timeline

```
320px ──────── 480px ──────── 640px ──────── 1024px ──────── 1280px
Mobile         XS Mobile      Tablet        Desktop        Large Desktop
   │                │            │             │              │
   │                │            │             │              │
VERTICAL        TRANSITION    HORIZONTAL     INLINE         FULL INLINE
LAYOUT          BEGINS        LAYOUT         LAYOUT         LAYOUT
   │                │            │             │              │
   └─ Avatar        │            │             │              │
   │  Centered      │            │             │              │
   │                │   Avatar   │   Avatar    │   Avatar inline
   │  Profile       │   Left     │   Left      │   with profile
   │  Info          │   Aligned  │   Aligned   │
   │  Centered      │            │             │   Profile info
   │                │   Profile  │   Profile   │   with avatar
   │  Stats         │   Info     │   Info      │
   │  Vertical      │   Left     │   Left      │   Full spacing
   │                │   Aligned  │   Aligned   │   optimization
   │  Avatar        │            │             │
   │  Below         │   Stats    │   Stats     │
   │                │   Horizontal  Horizontal│
   │                │   with divider  visible│
   │                │            │             │
```

---

## 🔄 Component Position Changes

### Mobile Layout

```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│                                     │
│        [Avatar - Centered]          │  Position: Center
│        w-24 h-24 (96px)             │
│                                     │
│        [Profile Info]               │  Position: Center
│        text-center                  │
│        ├─ Name: text-lg (18px)      │
│        ├─ Email: text-xs (12px)     │
│        └─ Stats: flex-col           │
│           ├─ Owned Travel           │
│           └─ Collaborative          │
│                                     │
│     [Adventure Avatar]              │  Position: Bottom
│     max-width: 280px                │
│     Centered                        │
│                                     │
└─────────────────────────────────────┘
```

### Tablet Layout (640px+)

```
┌──────────────────────────────────────────────┐
│  Header                                      │
├──────────────────────────────────────────────┤
│                                              │
│  [Avatar]  │  [Profile Info]                │  Position: Side by side
│  w-32      │  text-left                     │
│  h-32      │  ├─ Name: text-2xl (24px)     │
│  (128px)   │  ├─ Email: text-sm (14px)     │
│            │  └─ Stats: flex-row            │
│            │     ├─ Owned Travel │ 1       │  Divider visible
│            │     └─ Collaborative │ 0      │
│                                              │
│  [Adventure Avatar]                         │  Position: Bottom full width
│  max-width: 300px - 350px                   │
│  Centered                                    │
│                                              │
└──────────────────────────────────────────────┘
```

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────┐
│  Header                                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Avatar]      [Profile Info]      [Adventure Avatar]         │
│  w-40 h-40     text-left           Inline                     │
│  (160px)       ├─ Name: text-4xl   max-width: none            │
│                │     (36px)        Component scaled            │
│                ├─ Email: text-base │ with profile             │
│                │     (16px)        │ No height constraints    │
│                └─ Stats: flex-row  │                          │
│                   ├─ Owned 1      │                          │
│                   ├─ Divider │    │                          │
│                   └─ Collab 0     │                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Text Size Progression Chart

```
Mobile    XS         Small      Medium     Large       Extra Large
──────────────────────────────────────────────────────────────────

Heading (H1)
12pt ─┐   14pt ─┐    16pt ─┐   18pt ─┐   20pt ─┐    22pt ─┐
      │         │         │        │         │        │
     18px      20px      24px     30px      36px      42px
      │         │         │        │         │        │
text-lg  xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl


Body Text
11pt ─┐   12pt ─┐    13pt ─┐   14pt ─┐    14pt ─┐   14pt ─┐
      │         │         │        │         │        │
     12px      14px      16px     18px      18px      18px
      │         │         │        │         │        │
text-xs  xs:text-sm  sm:text-base md:text-lg  lg:text-lg xl:text-lg


Stat Values
12pt ─┐   13pt ─┐    14pt ─┐   15pt ─┐    16pt ─┐   17pt ─┐
      │         │         │        │         │        │
     14px      16px      18px     20px      20px      21px
      │         │         │        │         │        │
text-sm  xs:text-base sm:text-lg md:text-lg  lg:text-lg xl:text-xl
```

---

## 🎯 Breakpoint Grid

```
BREAKPOINT       SIZE RANGE       COMMON DEVICES           LAYOUT MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(no prefix)      0 - 479px        Mobile phones            flex-col
                 320px            iPhone 12 mini           Vertical
                 375px            iPhone 12-14             Stack
                 480px            iPhone SE

xs               480px - 639px    Small phones             flex-row
                 480px            Edge case (landscape)    Transition
                 600px            Galaxy A12

sm               640px - 767px    Large phones/            flex-row
                 640px            iPhone landscape         Horizontal
                 750px            Landscape phones         Begin

md               768px - 1023px   Tablets                  flex-row
                 768px            iPad mini                Horizontal
                 820px            Galaxy Tab               Fully responsive
                 1000px           iPad

lg               1024px - 1279px  Desktops/Laptops        Inline Avatar
                 1024px           iPad Pro                 Desktop mode
                 1280px           MacBook Air              Full layout
                 1366px           Desktop monitors

xl               1280px - 1535px  Large Desktops          Full inline
                 1280px           Standard laptops         Optimized spacing
                 1440px           High-res monitors        Max performance

2xl              1536px+          Ultra-wide               Full scale
                 1920px           Full HD monitors         Large spacing
                 2560px           4K displays              Maximum width
                 3840px           8K displays              Ultra-wide
```

---

## ✨ Visual Effects Scaling

```
Shadow Effect
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile          │      Tablet      │      Desktop
shadow-sm       │    shadow-md     │    shadow-lg

┌─────────┐      ┌────────────────┐  ┌──────────────────────┐
│ Profile │◄─────►│   Profile      │  │   Profile            │
│ Card    │      │   Card         │  │   Card               │
└─────────┘      └────────────────┘  └──────────────────────┘
Light            Medium             Heavy


Border Radius
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile          │      Tablet      │      Desktop
rounded-xl      │    rounded-2xl   │    rounded-2xl
(12px)          │     (16px)       │     (16px)

Consistent sizing after mobile


Avatar Border
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile          │      Tablet      │      Desktop
border-3        │    border-4      │    border-4
(3px)           │     (4px)        │     (4px)

Slightly thinner on mobile
```

---

## 📱 Real Device Examples

```
iPhone 12 mini (375px)       │  iPhone 14 Pro (390px)     │  iPhone 14 Plus (428px)
Vertical Stack               │  Vertical Stack            │  Vertical Stack
Avatar: 96px (w-24)          │  Avatar: 96px (w-24)      │  Avatar: 96px (w-24)
Title: 18px (text-lg)        │  Title: 18px (text-lg)    │  Title: 18px (text-lg)
No divider                   │  No divider               │  No divider
Stats: flex-col              │  Stats: flex-col          │  Stats: flex-col
Padding: 12px                │  Padding: 12px            │  Padding: 12px

iPad mini (768px)            │  iPad (834px)             │  iPad Pro 11" (834px)
Horizontal Layout            │  Horizontal Layout        │  Horizontal Layout
Avatar: 128px (sm:w-32)      │  Avatar: 144px (md:w-36) │  Avatar: 144px (md:w-36)
Title: 24px (sm:text-2xl)    │  Title: 30px (md:text-3xl)│ Title: 30px (md:text-3xl)
Divider visible              │  Divider visible          │  Divider visible
Stats: flex-row              │  Stats: flex-row          │  Stats: flex-row
Padding: 20px                │  Padding: 24px            │  Padding: 24px

MacBook Air (1440px)         │  Monitor 27" (1920px)     │  Monitor 4K (2560px)
Inline Avatar Layout         │  Inline Avatar Layout     │  Inline Avatar Layout
Avatar: 160px (lg:w-40)      │  Avatar: 160px (lg:w-40) │  Avatar: 192px (xl:w-48)
Title: 36px (lg:text-4xl)    │  Title: 36px (lg:text-4xl)│ Title: 42px (xl:text-5xl)
Full spacing: 40px (lg:gap-10)│ Full spacing: 40px       │  Full spacing: 40px+
Avatar inline                │  Avatar inline            │  Avatar inline
Padding: 32px                │  Padding: 32px            │  Padding: 32px
```

---

**Last Updated:** January 13, 2026  
**Status:** Complete & Visual  
**All Mockups:** Responsive & Accurate
