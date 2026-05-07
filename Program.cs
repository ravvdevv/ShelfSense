using ShelfSense.Database;
using ShelfSense.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<DatabaseHelper>();
builder.Services.AddScoped<StockAlertService>();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()));

var app = builder.Build();

app.UseCors();
app.MapGet("/", () => Results.Redirect("/html/index.html"));
app.UseStaticFiles();
app.MapControllers();

app.Run();