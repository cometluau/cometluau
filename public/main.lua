local InputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local CoreGui = game:GetService("CoreGui")

local Notification = loadstring(game:HttpGet(
    "https://pastebin.com/raw/MaW1FgPa"
))()

local Player = Players.LocalPlayer

local running = true
local connections = {}
local tweens = {}
local ScreenGui

local Icons = {
    Launch = "▶",
    Up = "↑",
    Down = "↓",
    Forward = "→",
    Backward = "←",
    Brake = "◈",
    Hide = "👁",
    Kill = "☠",
    Bubble = "☄"
}

local function track(connection)
    table.insert(connections, connection)
    return connection
end

local function cleanup()
    if not running then return end
    running = false

    for _, connection in ipairs(connections) do
        if connection.Connected then
            connection:Disconnect()
        end
    end

    table.clear(connections)

    for _, tween in ipairs(tweens) do
        tween:Cancel()
    end

    table.clear(tweens)

    if ScreenGui then
        ScreenGui:Destroy()
        ScreenGui = nil
    end
end

local function create(class, properties, parent)
    local object = Instance.new(class)

    for property, value in pairs(properties) do
        object[property] = value
    end

    object.Parent = parent
    return object
end

local function corner(object, radius)
    return create("UICorner", {
        CornerRadius = UDim.new(0, radius)
    }, object)
end

local MODEL_PATH = {
    "CarGame",
    "Vehicles",
    "User_" .. Player.UserId
}

local function findModel()
    local current = workspace

    for _, name in ipairs(MODEL_PATH) do
        current = current:FindFirstChild(name)

        if not current then
            return nil
        end
    end

    return current
end

local function getPrimaryPart()
    local model = findModel()

    if not model then
        return nil
    end

    return model.PrimaryPart
end

local TitleColors = {
    Color3.fromRGB(255, 255, 255),
    Color3.fromRGB(255, 255, 255),
    Color3.fromRGB(0, 0, 0)
}

local DescriptionColors = {
    Color3.fromRGB(120, 185, 255),
    Color3.fromRGB(255, 255, 255),
    Color3.fromRGB(120, 185, 255)
}

local AccentColors = {
    Color3.fromRGB(120, 185, 255),
    Color3.fromRGB(255, 255, 255),
    Color3.fromRGB(120, 185, 255)
}

local function gradient(object, colors, duration)
    local result = create("UIGradient", {
        Color = ColorSequence.new({
            ColorSequenceKeypoint.new(0, colors[1]),
            ColorSequenceKeypoint.new(0.5, colors[2]),
            ColorSequenceKeypoint.new(1, colors[3])
        }),
        Offset = Vector2.new(-1, 0),
        Rotation = 0
    }, object)

    local tween = TweenService:Create(
        result,
        TweenInfo.new(
            duration or 5,
            Enum.EasingStyle.Sine,
            Enum.EasingDirection.InOut,
            -1,
            true
        ),
        {
            Offset = Vector2.new(1, 0)
        }
    )

    table.insert(tweens, tween)
    tween:Play()

    return result
end

local function rotatingStrokeGradient(object, duration)
    local strokeGradient = create("UIGradient", {
        Color = ColorSequence.new({
            ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 0, 0)),
            ColorSequenceKeypoint.new(0.499, Color3.fromRGB(0, 0, 0)),
            ColorSequenceKeypoint.new(0.501, Color3.fromRGB(255, 255, 255)),
            ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 255, 255))
        }),
        Rotation = 0
    }, object)

    local rotation = 0
    local speed = 360 / (duration or 5)

    track(RunService.RenderStepped:Connect(function(deltaTime)
        if not running or not strokeGradient.Parent then
            return
        end

        rotation = (rotation + speed * deltaTime) % 360
        strokeGradient.Rotation = rotation
    end))

    return strokeGradient
end

local OriginalWidth = 360
local OriginalHeight = 366
local OriginalSize = UDim2.fromOffset(OriginalWidth, OriginalHeight)
local BubbleDiameter = 48

ScreenGui = create("ScreenGui", {
    Name = "CarLauncherControls",
    ResetOnSpawn = false,
    DisplayOrder = 2e9,
    ZIndexBehavior = Enum.ZIndexBehavior.Sibling
}, CoreGui)

local Main = create("CanvasGroup", {
    Name = "Main",
    Active = true,
    Size = UDim2.fromOffset(28, 28),
    AnchorPoint = Vector2.new(0.5, 0.5),
    Position = UDim2.fromScale(0.5, 0.5),
    BackgroundColor3 = Color3.fromRGB(15, 15, 15),
    BorderSizePixel = 0,
    GroupTransparency = 1
}, ScreenGui)

local MainScale = create("UIScale", {
    Scale = 1
}, Main)

local MainCorner = corner(Main, 14)

local MainStroke = create("UIStroke", {
    Color = Color3.fromRGB(180, 210, 255),
    Thickness = 2.5,
    Transparency = 0.2
}, Main)

rotatingStrokeGradient(MainStroke, 3)

local function clampPosition(position, size)
    local bounds = ScreenGui.AbsoluteSize

    if bounds.X <= 0 or bounds.Y <= 0 then
        return position
    end

    local halfX = size.X / 2
    local halfY = size.Y / 2

    local x = position.X.Scale * bounds.X + position.X.Offset
    local y = position.Y.Scale * bounds.Y + position.Y.Offset

    x = math.clamp(x, halfX, math.max(bounds.X - halfX, halfX))
    y = math.clamp(y, halfY, math.max(bounds.Y - halfY, halfY))

    return UDim2.fromOffset(x, y)
end

local function fit()
    local bounds = ScreenGui.AbsoluteSize

    if bounds.X <= 0 or bounds.Y <= 0 then
        return
    end

    MainScale.Scale = math.clamp(
        math.min((bounds.X - 16) / OriginalWidth, (bounds.Y - 16) / OriginalHeight),
        0.55,
        1
    )
end

fit()
track(ScreenGui:GetPropertyChangedSignal("AbsoluteSize"):Connect(fit))

local TopBar = create("Frame", {
    Size = UDim2.new(1, 0, 0, 65),
    BackgroundTransparency = 1
}, Main)

local Title = create("TextLabel", {
    Size = UDim2.new(1, -100, 0, 32),
    Position = UDim2.fromOffset(15, 7),
    BackgroundTransparency = 1,
    Text = "BUILD A CAR TO GO FAR",
    TextScaled = true,
    Font = Enum.Font.GothamBold,
    TextColor3 = Color3.new(1, 1, 1),
    TextXAlignment = Enum.TextXAlignment.Left
}, TopBar)

create("UITextSizeConstraint", {
    MaxTextSize = 20,
    MinTextSize = 10
}, Title)

gradient(Title, TitleColors, 3)

local Subtitle = create("TextLabel", {
    Size = UDim2.new(1, -100, 0, 20),
    Position = UDim2.fromOffset(16, 36),
    BackgroundTransparency = 1,
    Text = "LAUNCHER CONTROL PANEL  •  DRAG TO MOVE",
    TextSize = 10,
    Font = Enum.Font.GothamMedium,
    TextColor3 = Color3.new(1, 1, 1),
    TextXAlignment = Enum.TextXAlignment.Left
}, TopBar)

gradient(Subtitle, DescriptionColors, 6)

local MinimizeButton = create("TextButton", {
    Size = UDim2.fromOffset(32, 32),
    Position = UDim2.new(1, -82, 0, 14),
    BackgroundColor3 = Color3.fromRGB(25, 30, 40),
    Text = "—",
    TextSize = 17,
    Font = Enum.Font.GothamBold,
    TextColor3 = Color3.new(1, 1, 1),
    AutoButtonColor = false
}, TopBar)

corner(MinimizeButton, 9)
gradient(MinimizeButton, AccentColors, 4)

create("UIStroke", {
    Color = Color3.fromRGB(120, 180, 255),
    Thickness = 1
}, MinimizeButton)

local CloseButton = create("TextButton", {
    Size = UDim2.fromOffset(32, 32),
    Position = UDim2.new(1, -44, 0, 14),
    BackgroundColor3 = Color3.fromRGB(25, 30, 40),
    Text = "X",
    TextSize = 17,
    Font = Enum.Font.GothamBold,
    TextColor3 = Color3.new(1, 1, 1),
    AutoButtonColor = false
}, TopBar)

corner(CloseButton, 9)
gradient(CloseButton, AccentColors, 4)

create("UIStroke", {
    Color = Color3.fromRGB(120, 180, 255),
    Thickness = 1
}, CloseButton)

create("Frame", {
    Size = UDim2.new(1, -30, 0, 1),
    Position = UDim2.fromOffset(15, 67),
    BackgroundColor3 = Color3.fromRGB(150, 190, 255),
    BackgroundTransparency = 0.5,
    BorderSizePixel = 0
}, Main)

local Container = create("Frame", {
    Size = UDim2.new(1, -30, 0, 232),
    Position = UDim2.fromOffset(15, 82),
    BackgroundTransparency = 1
}, Main)

create("UIListLayout", {
    Padding = UDim.new(0, 8),
    SortOrder = Enum.SortOrder.LayoutOrder
}, Container)

local ButtonGap = 8
local ButtonIdle = Color3.fromRGB(20, 25, 35)
local ButtonPressed = Color3.fromRGB(45, 62, 90)

local function isPress(input)
    return input.UserInputType == Enum.UserInputType.MouseButton1
        or input.UserInputType == Enum.UserInputType.Touch
end

local function createRow(order)
    return create("Frame", {
        Size = UDim2.new(1, 0, 0, 52),
        BackgroundTransparency = 1,
        LayoutOrder = order
    }, Container)
end

local function createButton(row, index, count, icon, label, callback)
    local Button = create("TextButton", {
        Size = UDim2.new(1 / count, -ButtonGap * (count - 1) / count, 1, 0),
        Position = UDim2.new((index - 1) / count, (index - 1) * ButtonGap / count, 0, 0),
        BackgroundColor3 = ButtonIdle,
        BackgroundTransparency = 0.1,
        Text = "",
        AutoButtonColor = false
    }, row)

    corner(Button, 10)

    local Stroke = create("UIStroke", {
        Color = Color3.fromRGB(120, 170, 230),
        Thickness = 0.8,
        Transparency = 0.65
    }, Button)

    create("TextLabel", {
        Size = UDim2.new(1, 0, 0, 30),
        Position = UDim2.fromOffset(0, 3),
        BackgroundTransparency = 1,
        Text = icon,
        TextSize = 24,
        Font = Enum.Font.GothamBold,
        TextColor3 = Color3.new(1, 1, 1)
    }, Button)

    local Caption = create("TextLabel", {
        Size = UDim2.new(1, 0, 0, 14),
        Position = UDim2.new(0, 0, 1, -17),
        BackgroundTransparency = 1,
        Text = label,
        TextSize = 10,
        Font = Enum.Font.GothamMedium,
        TextColor3 = Color3.new(1, 1, 1)
    }, Button)

    gradient(Caption, DescriptionColors, 6)

    track(Button.InputBegan:Connect(function(input)
        if not isPress(input) then return end

        TweenService:Create(Button, TweenInfo.new(0.1), {
            BackgroundColor3 = ButtonPressed
        }):Play()

        TweenService:Create(Stroke, TweenInfo.new(0.1), {
            Transparency = 0.15
        }):Play()
    end))

    track(Button.InputEnded:Connect(function(input)
        if not isPress(input) then return end

        TweenService:Create(Button, TweenInfo.new(0.25), {
            BackgroundColor3 = ButtonIdle
        }):Play()

        TweenService:Create(Stroke, TweenInfo.new(0.25), {
            Transparency = 0.65
        }):Play()
    end))

    track(Button.Activated:Connect(callback))

    return Button
end

local StatusContainer = create("Frame", {
    Size = UDim2.new(0, 130, 0, 20),
    AnchorPoint = Vector2.new(0.5, 0),
    Position = UDim2.new(0.5, 0, 1, -25),
    BackgroundTransparency = 1
}, Main)

local StatusDot = create("TextLabel", {
    Size = UDim2.fromOffset(12, 20),
    Position = UDim2.fromOffset(0, 0),
    BackgroundTransparency = 1,
    Text = "●",
    TextSize = 10,
    Font = Enum.Font.GothamBold,
    TextColor3 = Color3.new(1, 1, 1),
    TextXAlignment = Enum.TextXAlignment.Left
}, StatusContainer)

local DotTween = TweenService:Create(
    StatusDot,
    TweenInfo.new(
        1.5,
        Enum.EasingStyle.Sine,
        Enum.EasingDirection.InOut,
        -1,
        true
    ),
    {
        TextColor3 = Color3.fromRGB(125, 255, 150)
    }
)

table.insert(tweens, DotTween)
DotTween:Play()

local Status = create("TextLabel", {
    Size = UDim2.new(1, -15, 1, 0),
    Position = UDim2.fromOffset(13, 0),
    BackgroundTransparency = 1,
    Text = "SYSTEM ACTIVE",
    TextSize = 10,
    Font = Enum.Font.GothamBold,
    TextColor3 = Color3.new(1, 1, 1),
    TextXAlignment = Enum.TextXAlignment.Left
}, StatusContainer)

gradient(Status, DescriptionColors, 6)

local Bubble = create("CanvasGroup", {
    Name = "Bubble",
    Active = true,
    Visible = false,
    Size = UDim2.fromOffset(30, 30),
    AnchorPoint = Vector2.new(0.5, 0.5),
    Position = UDim2.fromScale(0.5, 0.5),
    BackgroundColor3 = Color3.fromRGB(15, 15, 15),
    BorderSizePixel = 0,
    GroupTransparency = 1
}, ScreenGui)

create("UICorner", {
    CornerRadius = UDim.new(0.5, 0)
}, Bubble)

local BubbleStroke = create("UIStroke", {
    Color = Color3.fromRGB(180, 210, 255),
    Thickness = 2.5,
    Transparency = 0.2
}, Bubble)

rotatingStrokeGradient(BubbleStroke, 3)

create("TextLabel", {
    Size = UDim2.fromScale(1, 1),
    BackgroundTransparency = 1,
    Text = Icons.Bubble,
    TextSize = 24,
    Font = Enum.Font.GothamBold,
    TextColor3 = Color3.new(1, 1, 1)
}, Bubble)

local hidden = false
local animating = true

local dragging = false
local dragObject
local dragInput
local dragStart
local startPosition
local targetPosition
local dragDistance = 0

local function minimizeUI()
    if animating or hidden or not running then return end

    animating = true
    hidden = true
    dragging = false

    local center = Main.Position
    local bubbleOnMain = BubbleDiameter / MainScale.Scale

    local shrink = TweenService:Create(
        Main,
        TweenInfo.new(
            0.6,
            Enum.EasingStyle.Quint,
            Enum.EasingDirection.InOut
        ),
        {
            Size = UDim2.fromOffset(bubbleOnMain, bubbleOnMain),
            GroupTransparency = 1
        }
    )

    local round = TweenService:Create(
        MainCorner,
        TweenInfo.new(
            0.6,
            Enum.EasingStyle.Quint,
            Enum.EasingDirection.InOut
        ),
        {
            CornerRadius = UDim.new(0, 24)
        }
    )

    shrink:Play()
    round:Play()

    shrink.Completed:Wait()

    if not running then
        animating = false
        return
    end

    Main.Visible = false

    Bubble.Position = clampPosition(center, Vector2.new(BubbleDiameter, BubbleDiameter))
    Bubble.Size = UDim2.fromOffset(30, 30)
    Bubble.GroupTransparency = 1
    Bubble.Visible = true

    local appear = TweenService:Create(
        Bubble,
        TweenInfo.new(
            0.45,
            Enum.EasingStyle.Back,
            Enum.EasingDirection.Out
        ),
        {
            Size = UDim2.fromOffset(BubbleDiameter, BubbleDiameter),
            GroupTransparency = 0
        }
    )

    appear:Play()
    appear.Completed:Wait()

    animating = false
end

local function restoreUI()
    if animating or not hidden or not running then return end

    animating = true
    hidden = false
    dragging = false

    local center = Bubble.Position

    local vanish = TweenService:Create(
        Bubble,
        TweenInfo.new(
            0.25,
            Enum.EasingStyle.Quad,
            Enum.EasingDirection.In
        ),
        {
            Size = UDim2.fromOffset(30, 30),
            GroupTransparency = 1
        }
    )

    vanish:Play()
    vanish.Completed:Wait()

    if not running then
        animating = false
        return
    end

    Bubble.Visible = false

    local scale = MainScale.Scale
    local bubbleOnMain = BubbleDiameter / scale

    local finalPosition = clampPosition(
        center,
        Vector2.new(OriginalWidth * scale, OriginalHeight * scale)
    )

    Main.Position = center
    Main.Size = UDim2.fromOffset(bubbleOnMain, bubbleOnMain)
    Main.GroupTransparency = 1
    MainCorner.CornerRadius = UDim.new(0, 24)
    Main.Visible = true

    local expand = TweenService:Create(
        Main,
        TweenInfo.new(
            0.8,
            Enum.EasingStyle.Quint,
            Enum.EasingDirection.Out
        ),
        {
            Size = OriginalSize,
            Position = finalPosition,
            GroupTransparency = 0
        }
    )

    local round = TweenService:Create(
        MainCorner,
        TweenInfo.new(
            0.8,
            Enum.EasingStyle.Quint,
            Enum.EasingDirection.Out
        ),
        {
            CornerRadius = UDim.new(0, 16)
        }
    )

    expand:Play()
    round:Play()

    expand.Completed:Wait()

    animating = false
end

local function shutdown()
    if not running or animating then return end

    animating = true
    hidden = true
    dragging = false

    local shrink = TweenService:Create(
        Main,
        TweenInfo.new(
            0.65,
            Enum.EasingStyle.Quint,
            Enum.EasingDirection.InOut
        ),
        {
            Size = UDim2.fromOffset(12, 12),
            GroupTransparency = 1
        }
    )

    local round = TweenService:Create(
        MainCorner,
        TweenInfo.new(
            0.65,
            Enum.EasingStyle.Quint,
            Enum.EasingDirection.InOut
        ),
        {
            CornerRadius = UDim.new(0, 6)
        }
    )

    shrink:Play()
    round:Play()

    shrink.Completed:Wait()

    cleanup()

    Notification:Notify("Script Killed!", 1)
end

local function withPart(callback)
    return function()
        if not running then return end

        local part = getPrimaryPart()

        if part then
            callback(part)
        end
    end
end

local RowOne = createRow(1)
local RowTwo = createRow(2)
local RowThree = createRow(3)
local RowFour = createRow(4)

createButton(RowOne, 1, 1, Icons.Launch, "LAUNCH", withPart(function(part)
    part.AssemblyLinearVelocity = Vector3.new(0, 500, -1000)
end))

createButton(RowTwo, 1, 2, Icons.Up, "UP +250", withPart(function(part)
    part.AssemblyLinearVelocity = part.AssemblyLinearVelocity + Vector3.new(0, 250, 0)
end))

createButton(RowTwo, 2, 2, Icons.Down, "DOWN -250", withPart(function(part)
    part.AssemblyLinearVelocity = part.AssemblyLinearVelocity + Vector3.new(0, -250, 0)
end))

createButton(RowThree, 1, 2, Icons.Forward, "FORWARD +500", withPart(function(part)
    part.AssemblyLinearVelocity = part.AssemblyLinearVelocity + Vector3.new(0, 0, -500)
end))

createButton(RowThree, 2, 2, Icons.Backward, "BACKWARD -500", withPart(function(part)
    part.AssemblyLinearVelocity = part.AssemblyLinearVelocity + Vector3.new(0, 0, 500)
end))

createButton(RowFour, 1, 3, Icons.Brake, "BRAKE", withPart(function(part)
    part.Velocity = Vector3.zero
end))

createButton(RowFour, 2, 3, Icons.Hide, "HIDE", minimizeUI)
createButton(RowFour, 3, 3, Icons.Kill, "KILL", shutdown)

local function beginDrag(object, input)
    dragging = true
    dragObject = object
    dragInput = input
    dragStart = input.Position
    startPosition = object.Position
    targetPosition = object.Position
    dragDistance = 0
end

track(TopBar.InputBegan:Connect(function(input)
    if animating or hidden then return end

    if isPress(input) then
        beginDrag(Main, input)
    end
end))

track(Bubble.InputBegan:Connect(function(input)
    if animating or not hidden then return end

    if isPress(input) then
        beginDrag(Bubble, input)
    end
end))

track(InputService.InputChanged:Connect(function(input)
    if not dragging or not dragObject then return end

    local isMouse = input.UserInputType == Enum.UserInputType.MouseMovement
    local isTouch = input.UserInputType == Enum.UserInputType.Touch and input == dragInput

    if not isMouse and not isTouch then return end

    local delta = input.Position - dragStart

    dragDistance = math.max(dragDistance, delta.Magnitude)

    targetPosition = clampPosition(
        UDim2.new(
            startPosition.X.Scale,
            startPosition.X.Offset + delta.X,
            startPosition.Y.Scale,
            startPosition.Y.Offset + delta.Y
        ),
        dragObject.AbsoluteSize
    )
end))

track(InputService.InputEnded:Connect(function(input)
    if not dragging then return end

    local isMouse = input.UserInputType == Enum.UserInputType.MouseButton1
    local isTouch = input.UserInputType == Enum.UserInputType.Touch and input == dragInput

    if not isMouse and not isTouch then return end

    local object = dragObject
    local moved = dragDistance

    dragging = false
    dragObject = nil
    dragInput = nil

    if object == Bubble and moved < 10 then
        restoreUI()
    end
end))

track(RunService.RenderStepped:Connect(function(dt)
    if dragging and dragObject and targetPosition and running and not animating then
        local alpha = 1 - math.exp(-18 * dt)
        dragObject.Position = dragObject.Position:Lerp(targetPosition, alpha)
    end
end))

track(MinimizeButton.Activated:Connect(minimizeUI))
track(CloseButton.Activated:Connect(shutdown))

Main.Visible = true
Main.Size = UDim2.fromOffset(28, 28)
Main.GroupTransparency = 1
MainCorner.CornerRadius = UDim.new(0, 14)

local introExpand = TweenService:Create(
    Main,
    TweenInfo.new(
        0.9,
        Enum.EasingStyle.Quint,
        Enum.EasingDirection.Out
    ),
    {
        Size = OriginalSize,
        GroupTransparency = 0
    }
)

local introRound = TweenService:Create(
    MainCorner,
    TweenInfo.new(
        0.9,
        Enum.EasingStyle.Quint,
        Enum.EasingDirection.Out
    ),
    {
        CornerRadius = UDim.new(0, 16)
    }
)

introExpand:Play()
introRound:Play()

introExpand.Completed:Wait()

if running then
    animating = false
    Notification:Notify("Build A Car Launcher Loaded!", 3)
end
