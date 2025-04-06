import pygame as pg
import random
import sys

# Configurações iniciais
def set_screen_size(width, height):
    global SCREEN_WIDTH, SCREEN_HEIGHT, screen
    SCREEN_WIDTH, SCREEN_HEIGHT = width, height
    screen = pg.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pg.RESIZABLE)

pg.init()
font = pg.font.SysFont("Arial", 40, bold=True)
small_font = pg.font.SysFont("Arial", 30, bold=True)
clock = pg.time.Clock()
set_screen_size(800, 600)

GRID_SIZE = 20
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
BLACK = (0, 0, 0)
GRAY = (100, 100, 100)

paused = False
score = 0

def draw_text(text, x, y, color=WHITE, font_type=font):
    render = font_type.render(text, True, color)
    rect = render.get_rect(center=(x, y))
    screen.blit(render, rect)

def draw_snake(snake):
    for segment in snake:
        pg.draw.rect(screen, GREEN, (*segment, GRID_SIZE, GRID_SIZE))

def spawn_apple():
    return [random.randint(0, (SCREEN_WIDTH // GRID_SIZE) - 1) * GRID_SIZE,
            random.randint(0, (SCREEN_HEIGHT // GRID_SIZE) - 1) * GRID_SIZE]

def draw_apple(apple):
    pg.draw.circle(screen, RED, (apple[0] + GRID_SIZE // 2, apple[1] + GRID_SIZE // 2), GRID_SIZE // 2)

def resolution_menu():
    running = True
    while running:
        screen.fill(BLACK)
        draw_text("Choose Resolution", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 4)
        res_800 = pg.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 - 75, 200, 50)
        res_1024 = pg.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2, 200, 50)
        res_1280 = pg.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 + 75, 200, 50)

        pg.draw.rect(screen, GREEN, res_800)
        pg.draw.rect(screen, GREEN, res_1024)
        pg.draw.rect(screen, GREEN, res_1280)
        
        draw_text("800x600", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50)
        draw_text("1024x768", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 25)
        draw_text("1280x720", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 100)

        pg.display.flip()
        
        for event in pg.event.get():
            if event.type == pg.QUIT:
                pg.quit()
                sys.exit()
            if event.type == pg.MOUSEBUTTONDOWN:
                if res_800.collidepoint(event.pos):
                    set_screen_size(800, 600)
                    running = False
                if res_1024.collidepoint(event.pos):
                    set_screen_size(1024, 768)
                    running = False
                if res_1280.collidepoint(event.pos):
                    set_screen_size(1280, 720)
                    running = False

def main_menu():
    running = True
    while running:
        screen.fill(BLACK)
        draw_text("Snake Game", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 4)
        start_button = pg.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 - 50, 200, 50)
        quit_button = pg.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 + 50, 200, 50)
        
        pg.draw.rect(screen, GREEN, start_button)
        pg.draw.rect(screen, RED, quit_button)
        draw_text("Start", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 25)
        draw_text("Quit", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 75)
        
        pg.display.flip()
        
        for event in pg.event.get():
            if event.type == pg.QUIT:
                pg.quit()
                sys.exit()
            if event.type == pg.MOUSEBUTTONDOWN:
                if start_button.collidepoint(event.pos):
                    running = False
                if quit_button.collidepoint(event.pos):
                    pg.quit()
                    sys.exit()

def pause_menu():
    global paused
    while paused:
        screen.fill(BLACK)
        draw_text("Paused", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 4)
        resume_button = pg.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 - 50, 200, 50)
        quit_button = pg.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 + 50, 200, 50)
        
        pg.draw.rect(screen, GREEN, resume_button)
        pg.draw.rect(screen, RED, quit_button)
        draw_text("Resume", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 25)
        draw_text("Quit", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 75)
        
        pg.display.flip()
        
        for event in pg.event.get():
            if event.type == pg.QUIT:
                pg.quit()
                sys.exit()
            if event.type == pg.MOUSEBUTTONDOWN:
                if resume_button.collidepoint(event.pos):
                    paused = False
                if quit_button.collidepoint(event.pos):
                    pg.quit()
                    sys.exit()
            if event.type == pg.KEYDOWN and event.key == pg.K_ESCAPE:
                paused = False

def game_over_menu(final_score):
    running = True
    while running:
        screen.fill(BLACK)
        draw_text("Game Over", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 4)
        draw_text(f"Final Score: {final_score}", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 3)
        
        restart_button = pg.Rect(SCREEN_WIDTH // 2 - 150, SCREEN_HEIGHT // 2, 300, 50)
        menu_button = pg.Rect(SCREEN_WIDTH // 2 - 150, SCREEN_HEIGHT // 2 + 80, 300, 50)
        
        pg.draw.rect(screen, GREEN, restart_button)
        pg.draw.rect(screen, GRAY, menu_button)
        
        draw_text("Restart Game", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 25, font_type=small_font)
        draw_text("Main Menu", SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 105, font_type=small_font)
        
        pg.display.flip()
        
        for event in pg.event.get():
            if event.type == pg.QUIT:
                pg.quit()
                sys.exit()
            if event.type == pg.MOUSEBUTTONDOWN:
                if restart_button.collidepoint(event.pos):
                    return "restart"
                if menu_button.collidepoint(event.pos):
                    return "menu"

def game_loop():
    global paused, score
    snake = [[100, 100]]
    apple = spawn_apple()
    direction = (GRID_SIZE, 0)
    running = True
    
    while running:
        screen.fill(BLACK)
        draw_snake(snake)
        draw_apple(apple)
        draw_text(f"Score: {score}", 100, 20)
        
        for event in pg.event.get():
            if event.type == pg.QUIT:
                pg.quit()
                sys.exit()
            if event.type == pg.KEYDOWN:
                if event.key == pg.K_UP and direction != (0, GRID_SIZE):
                    direction = (0, -GRID_SIZE)
                if event.key == pg.K_DOWN and direction != (0, -GRID_SIZE):
                    direction = (0, GRID_SIZE)
                if event.key == pg.K_LEFT and direction != (GRID_SIZE, 0):
                    direction = (-GRID_SIZE, 0)
                if event.key == pg.K_RIGHT and direction != (-GRID_SIZE, 0):
                    direction = (GRID_SIZE, 0)
                if event.key == pg.K_ESCAPE:
                    paused = True
                    pause_menu()
        
        new_head = [snake[0][0] + direction[0], snake[0][1] + direction[1]]
        
        # Verifica colisão com as bordas
        if (new_head[0] < 0 or new_head[0] >= SCREEN_WIDTH or 
            new_head[1] < 0 or new_head[1] >= SCREEN_HEIGHT):
            action = game_over_menu(score)
            if action == "restart":
                score = 0
                snake = [[100, 100]]  # Reset snake
                apple = spawn_apple()  # New apple
                direction = (GRID_SIZE, 0)  # Reset direction
                continue  # Continua o jogo imediatamente
            else:
                return "menu"
        
        # Verifica colisão com o próprio corpo
        if new_head in snake[1:]:
            action = game_over_menu(score)
            if action == "restart":
                score = 0
                snake = [[100, 100]]  # Reset snake
                apple = spawn_apple()  # New apple
                direction = (GRID_SIZE, 0)  # Reset direction
                continue  # Continua o jogo imediatamente
            else:
                return "menu"
        
        snake.insert(0, new_head)
        if new_head == apple:
            score += 10
            apple = spawn_apple()
        else:
            snake.pop()
        
        pg.display.flip()
        clock.tick(10)

if __name__ == "__main__":
    while True:
        resolution_menu()
        main_menu()
        while True:  # Loop interno para reiniciar o jogo sem voltar ao menu
            result = game_loop()
            if result != "restart":
                break