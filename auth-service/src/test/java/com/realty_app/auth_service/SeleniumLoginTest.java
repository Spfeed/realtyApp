package com.realty_app.auth_service;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

class SeleniumLoginTest {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setUp() {
        WebDriverManager.firefoxdriver().setup();

        driver = new FirefoxDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.manage().window().maximize();
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void login_shouldOpenListingsPage() throws InterruptedException {

        loginAsTestUser();

        wait.until(ExpectedConditions.urlContains("/listings"));

        Assertions.assertTrue(driver.getCurrentUrl().contains("/listings"));
    }

    @Test
    void user_shouldCreateListing() throws InterruptedException {

        loginAsTestUser();

        driver.findElement(By.cssSelector("[data-testid='open-create-listing']"))
                .click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='listing-title']")
        ));

        driver.findElement(By.cssSelector("[data-testid='listing-title']"))
                .sendKeys("Selenium квартира");

        driver.findElement(By.cssSelector("[data-testid='listing-area']"))
                .sendKeys("45");

        driver.findElement(By.cssSelector("[data-testid='listing-price']"))
                .sendKeys("40000");

        driver.findElement(By.cssSelector("[data-testid='listing-description']"))
                .sendKeys("Тестовое объявление");

        driver.findElement(By.cssSelector("[data-testid='listing-deposit']"))
                .sendKeys("20000");

        driver.findElement(By.cssSelector("[data-testid='listing-floor']"))
                .sendKeys("3");

        new Select(driver.findElement(
                By.cssSelector("[data-testid='listing-city']")))
                .selectByIndex(1);

        wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("[data-testid='listing-district']")
        ));

        new Select(driver.findElement(
                By.cssSelector("[data-testid='listing-district']")))
                .selectByIndex(1);

        driver.findElement(By.cssSelector("[data-testid='listing-street']"))
                .sendKeys("Ленина");

        driver.findElement(By.cssSelector("[data-testid='listing-house']"))
                .sendKeys("10");

        driver.findElement(By.cssSelector("[data-testid='listing-submit']"))
                .click();

        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.cssSelector(".create-listing-card")
        ));

        Assertions.assertTrue(
                driver.getPageSource().contains("Selenium квартира")
        );
    }

    @Test
    void user_shouldSearchListingByTitle() throws InterruptedException {
        loginAsTestUser();

        WebElement searchInput = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='listings-search']")
        ));

        searchInput.sendKeys("тест");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.cssSelector(".listings-grid"),
                "тест"
        ));

        Assertions.assertTrue(driver.getPageSource().contains("тест"));
    }

    private void loginAsTestUser() throws InterruptedException {
        driver.get("http://localhost:5173/login");

        WebElement emailInput = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("[data-testid='login-email']")
        ));

        emailInput.clear();
        emailInput.sendKeys("test@mail.com");

        WebElement passwordInput = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("[data-testid='login-password']")
        ));

        passwordInput.clear();
        passwordInput.sendKeys("12345678a");

        System.out.println(emailInput.getAttribute("value"));
        System.out.println(passwordInput.getAttribute("value"));

        driver.findElement(By.cssSelector("[data-testid='login-submit']")).click();

        wait.until(ExpectedConditions.urlContains("/listings"));
    }
}