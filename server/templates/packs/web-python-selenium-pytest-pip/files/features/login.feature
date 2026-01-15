Feature: Login Functionality
  As a user
  I want to login to the application
  So that I can access my account

  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter valid username
    And I enter valid password
    And I click the login button
    Then I should be redirected to the inventory page

  @regression
  Scenario: Failed login with invalid credentials
    When I enter invalid username
    And I enter invalid password
    And I click the login button
    Then I should see an error message