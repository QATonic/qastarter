/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectConfig:
 *       type: object
 *       required:
 *         - testingType
 *         - framework
 *         - language
 *         - testingPattern
 *         - testRunner
 *         - buildTool
 *         - projectName
 *       properties:
 *         testingType:
 *           type: string
 *           enum: [web, mobile, api, desktop]
 *           description: Type of testing
 *         framework:
 *           type: string
 *           description: Testing framework (e.g., selenium, playwright)
 *         language:
 *           type: string
 *           description: Programming language (e.g., java, python)
 *         testingPattern:
 *           type: string
 *           description: Testing pattern (e.g., page-object-model, bdd)
 *         testRunner:
 *           type: string
 *           description: Test runner (e.g., testng, junit5)
 *         buildTool:
 *           type: string
 *           description: Build tool (e.g., maven, gradle)
 *         projectName:
 *           type: string
 *           description: Name for the generated project
 *         cicdTool:
 *           type: string
 *           description: Optional CI/CD tool
 *         reportingTool:
 *           type: string
 *           description: Optional reporting tool
 *     
 *     ValidationMatrix:
 *       type: object
 *       properties:
 *         testingTypes:
 *           type: array
 *           items:
 *             type: string
 *         frameworks:
 *           type: object
 *         languages:
 *           type: object
 *     
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             message:
 *               type: string
 *     
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, degraded, unhealthy]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         version:
 *           type: string
 *         uptime:
 *           type: number
 */

export { };
