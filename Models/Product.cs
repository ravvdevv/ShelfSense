namespace ShelfSense.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string Category { get; set; } = "";

    // Book 
    public string? Author { get; set; }
    public string? Isbn { get; set; }
    public string? Genre { get; set; }

    // Magazine 
    public int? Issue { get; set; }
    public string? PubDate { get; set; }

    // Stationery 
    public string? Brand { get; set; }
    public string? Size { get; set; }
}